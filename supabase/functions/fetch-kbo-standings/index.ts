import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// KBO API 팀명 → DB ID 매핑
const TEAM_NAME_MAP: Record<string, string> = {
  KT: "KT",
  LG: "LG",
  삼성: "삼성",
  SSG: "SSG",
  KIA: "KIA",
  두산: "두산",
  한화: "한화",
  NC: "NC",
  롯데: "롯데",
  키움: "키움",
};

interface StandingRow {
  team_id: string;
  rank: number;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  games_behind: string;
  streak: string;
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

    // KBO 공식 순위 API 호출
    const res = await fetch(
      "https://www.koreabaseball.com/ws/Main.asmx/GetTeamRank",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Referer: "https://www.koreabaseball.com/",
        },
        body: "",
      },
    );

    if (!res.ok) {
      throw new Error(`KBO API responded with ${res.status}`);
    }

    const data = await res.json();
    const rows = data?.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("No standings data in KBO API response");
    }

    // 파싱: rows[].row[] → [순위, 팀명HTML, 경기, 승, 패, 무, 승률, 게임차, 연속]
    const standings: StandingRow[] = [];

    for (const item of rows) {
      const cells = item.row;
      if (!Array.isArray(cells) || cells.length < 9) continue;

      // 팀명에서 HTML 태그 제거: "<span class='team-name'>KT</span>" → "KT"
      const teamNameRaw = cells[1].Text || "";
      const teamName = teamNameRaw.replace(/<[^>]*>/g, "").trim();
      const teamId = TEAM_NAME_MAP[teamName];

      if (!teamId) {
        console.warn(`Unknown team name: ${teamName}`);
        continue;
      }

      standings.push({
        team_id: teamId,
        rank: parseInt(cells[0].Text, 10) || 0,
        games_played: parseInt(cells[2].Text, 10) || 0,
        wins: parseInt(cells[3].Text, 10) || 0,
        losses: parseInt(cells[4].Text, 10) || 0,
        draws: parseInt(cells[5].Text, 10) || 0,
        win_rate: parseFloat(cells[6].Text) || 0,
        games_behind: cells[7].Text || "-",
        streak: cells[8].Text || "",
      });
    }

    if (standings.length === 0) {
      throw new Error("Failed to parse any team standings");
    }

    // Supabase에 upsert
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: upsertError } = await supabase
      .from("team_standings")
      .upsert(
        standings.map((s) => ({
          ...s,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "team_id" },
      );

    if (upsertError) {
      throw new Error(`Supabase upsert failed: ${upsertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        title: data.title || "",
        teams: standings.length,
        standings: standings.map((s) => ({
          rank: s.rank,
          team: s.team_id,
          record: `${s.wins}승 ${s.losses}패 ${s.draws}무`,
          win_rate: s.win_rate,
          gb: s.games_behind,
          streak: s.streak,
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
    console.error("fetch-kbo-standings error:", err);
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
