import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// KBO API 팀코드 → DB ID 매핑
const KBO_TEAM_MAP: Record<string, string> = {
  OB: "두산",
  LG: "LG",
  NC: "NC",
  SK: "SSG",
  WO: "키움",
  SS: "삼성",
  LT: "롯데",
  KT: "KT",
  HH: "한화",
  HT: "KIA",
};

// 구장명 → 풀네임 매핑
const STADIUM_MAP: Record<string, string> = {
  잠실: "잠실야구장",
  문학: "인천 SSG 랜더스필드",
  대구: "대구 삼성 라이온즈 파크",
  광주: "광주-기아 챔피언스 필드",
  수원: "수원 KT 위즈 파크",
  창원: "창원 NC 파크",
  고척: "고척 스카이돔",
  대전: "한화생명 이글스 파크",
  부산: "부산 사직야구장",
  사직: "부산 사직야구장",
  울산: "울산 문수야구장",
};

interface GameData {
  home_team_id: string;
  away_team_id: string;
  date: string;
  time: string | null;
  stadium: string | null;
  status: "scheduled" | "live" | "finished" | "cancelled";
  home_score: number;
  away_score: number;
  home_pitcher: string | null;
  away_pitcher: string | null;
}

/**
 * KBO GetKboGameList API에서 특정 날짜의 경기 데이터를 가져온다.
 */
async function fetchKboDay(dateStr: string): Promise<GameData[]> {
  const dateParam = dateStr.replace(/-/g, "");
  const year = dateStr.substring(0, 4);

  const params = new URLSearchParams({
    leId: "1",
    srId: "0",
    seasonId: year,
    date: dateParam,
  });

  const res = await fetch(
    "https://www.koreabaseball.com/ws/Main.asmx/GetKboGameList",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Referer: "https://www.koreabaseball.com/",
      },
      body: params.toString(),
    },
  );

  if (!res.ok) {
    throw new Error(`KBO API responded with ${res.status}`);
  }

  const data = await res.json();
  const games: GameData[] = [];

  const gameList = data?.game;
  if (!Array.isArray(gameList)) {
    return games;
  }

  for (const item of gameList) {
    const homeCode = item.HOME_ID?.trim();
    const awayCode = item.AWAY_ID?.trim();

    if (!homeCode || !awayCode) continue;

    const homeTeamId = KBO_TEAM_MAP[homeCode];
    const awayTeamId = KBO_TEAM_MAP[awayCode];

    if (!homeTeamId || !awayTeamId) {
      console.warn(`Unknown team code: home=${homeCode}, away=${awayCode}`);
      continue;
    }

    const time: string | null = item.G_TM?.trim() || null;

    const stadiumShort = item.S_NM?.trim() || null;
    const stadium = stadiumShort
      ? STADIUM_MAP[stadiumShort] || stadiumShort
      : null;

    const cancelId = String(item.CANCEL_SC_ID ?? "0").trim();
    const gameState = String(item.GAME_STATE_SC ?? "0").trim();

    let status: GameData["status"];
    if (cancelId !== "0") {
      status = "cancelled";
    } else if (gameState === "3") {
      status = "finished";
    } else if (gameState === "2") {
      status = "live";
    } else {
      status = "scheduled";
    }

    const homeScore = parseInt(item.B_SCORE_CN, 10) || 0;
    const awayScore = parseInt(item.T_SCORE_CN, 10) || 0;

    const homePitcher = item.B_PIT_P_NM?.trim() || null;
    const awayPitcher = item.T_PIT_P_NM?.trim() || null;

    games.push({
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      date: dateStr,
      time,
      stadium,
      status,
      home_score: homeScore,
      away_score: awayScore,
      home_pitcher: homePitcher,
      away_pitcher: awayPitcher,
    });
  }

  return games;
}

function getTodayKST(): string {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00+09:00");
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * DB 기존 경기와 API 경기를 비교해서 변경된 것만 반환
 */
function diffGames(
  apiGames: GameData[],
  dbGames: Array<Record<string, unknown>>,
): { toInsert: GameData[]; toUpdate: GameData[] } {
  const toInsert: GameData[] = [];
  const toUpdate: GameData[] = [];

  // DB 경기를 "홈팀_원정팀_날짜" 키로 인덱싱
  const dbMap = new Map<string, Record<string, unknown>>();
  for (const db of dbGames) {
    const key = `${db.home_team_id}_${db.away_team_id}_${db.date}`;
    dbMap.set(key, db);
  }

  for (const api of apiGames) {
    const key = `${api.home_team_id}_${api.away_team_id}_${api.date}`;
    const existing = dbMap.get(key);

    if (!existing) {
      // DB에 없는 새 경기
      toInsert.push(api);
      continue;
    }

    // DB에 있으면 변경사항 체크
    // DB의 time은 "18:30:00" (초 포함), API는 "18:30" → 앞 5글자만 비교
    const dbTime = typeof existing.time === "string"
      ? existing.time.substring(0, 5)
      : null;
    const apiTime = api.time ? api.time.substring(0, 5) : null;

    const changed =
      existing.status !== api.status ||
      existing.home_score !== api.home_score ||
      existing.away_score !== api.away_score ||
      (existing.home_pitcher ?? null) !== (api.home_pitcher ?? null) ||
      (existing.away_pitcher ?? null) !== (api.away_pitcher ?? null) ||
      dbTime !== apiTime ||
      (existing.stadium ?? null) !== (api.stadium ?? null);

    if (changed) {
      toUpdate.push(api);
    }
  }

  return { toInsert, toUpdate };
}

serve(async (req) => {
  try {
    // CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        },
      });
    }

    // 요청 파라미터: date 있으면 해당 날짜만, 없으면 오늘 ±3일 (7일)
    let dates: string[] = [];
    try {
      const body = await req.json();
      if (body.date) {
        dates = [body.date];
      }
    } catch {
      // body 없으면 7일치
    }

    if (dates.length === 0) {
      const today = getTodayKST();
      for (let i = -3; i <= 3; i++) {
        dates.push(addDays(today, i));
      }
    }

    // KBO API에서 전체 날짜 경기 가져오기
    const allApiGames: GameData[] = [];
    for (const d of dates) {
      const dayGames = await fetchKboDay(d);
      allApiGames.push(...dayGames);
    }

    // Supabase 클라이언트
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // DB에서 해당 날짜 범위의 기존 경기 조회
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];

    const { data: dbGames, error: selectError } = await supabase
      .from("games")
      .select(
        "home_team_id, away_team_id, date, time, stadium, status, home_score, away_score, home_pitcher, away_pitcher",
      )
      .gte("date", minDate)
      .lte("date", maxDate);

    if (selectError) {
      throw new Error(`DB select failed: ${selectError.message}`);
    }

    // 변경분만 추출
    const { toInsert, toUpdate } = diffGames(allApiGames, dbGames || []);
    const toUpsert = [...toInsert, ...toUpdate];

    if (toUpsert.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          dates: `${minDate} ~ ${maxDate}`,
          api_games: allApiGames.length,
          inserted: 0,
          updated: 0,
          message: "No changes detected",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // 변경분만 upsert
    const { error: upsertError } = await supabase
      .from("games")
      .upsert(toUpsert, {
        onConflict: "home_team_id,away_team_id,date",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      throw new Error(`Supabase upsert failed: ${upsertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        dates: `${minDate} ~ ${maxDate}`,
        api_games: allApiGames.length,
        inserted: toInsert.length,
        updated: toUpdate.length,
        changes: toUpsert.map((g) => ({
          away: g.away_team_id,
          home: g.home_team_id,
          date: g.date,
          status: g.status,
          score: `${g.away_score}:${g.home_score}`,
          home_pitcher: g.home_pitcher,
          away_pitcher: g.away_pitcher,
        })),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (err) {
    console.error("fetch-kbo-games error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});
