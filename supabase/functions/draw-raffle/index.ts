import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // KST 기준 오늘 날짜
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const todayKST = kstNow.toISOString().slice(0, 10);

    // 1. 종료 대상 active 라운드 조회 (end_date <= 오늘)
    const { data: rounds, error: roundError } = await supabase
      .from("raffle_rounds")
      .select("*")
      .eq("status", "active")
      .lte("end_date", todayKST);

    if (roundError) throw roundError;
    if (!rounds || rounds.length === 0) {
      return new Response(
        JSON.stringify({ message: "추첨 대상 라운드 없음" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results = [];

    for (const round of rounds) {
      // 2. 해당 라운드 티켓 전체 조회
      const { data: tickets, error: ticketError } = await supabase
        .from("raffle_tickets")
        .select("user_id")
        .eq("round_id", round.id);

      if (ticketError) throw ticketError;

      if (!tickets || tickets.length === 0) {
        // 티켓 없으면 라운드만 완료 처리
        await supabase
          .from("raffle_rounds")
          .update({ status: "completed" })
          .eq("id", round.id);

        results.push({
          round_number: round.round_number,
          winners: 0,
          message: "응모자 없음",
        });
        continue;
      }

      // 3. 가중 풀 구성 (티켓 많을수록 확률 높음)
      const pool: string[] = tickets.map((t) => t.user_id);

      // Fisher-Yates 셔플
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      // unique user 선정 (winner_count명)
      const winners: string[] = [];
      const seen = new Set<string>();
      for (const userId of pool) {
        if (seen.has(userId)) continue;
        seen.add(userId);
        winners.push(userId);
        if (winners.length >= round.winner_count) break;
      }

      // 4. raffle_winners INSERT
      if (winners.length > 0) {
        const rows = winners.map((userId) => ({
          round_id: round.id,
          user_id: userId,
        }));
        const { error: winError } = await supabase
          .from("raffle_winners")
          .insert(rows);
        if (winError) throw winError;
      }

      // 5. 라운드 status → completed
      await supabase
        .from("raffle_rounds")
        .update({ status: "completed" })
        .eq("id", round.id);

      // 6. 다음 라운드 자동 생성
      const nextStart = new Date(kstNow);
      nextStart.setDate(nextStart.getDate() + 1);
      const nextEnd = new Date(nextStart);
      nextEnd.setDate(nextEnd.getDate() + 6);

      await supabase.from("raffle_rounds").insert({
        round_number: round.round_number + 1,
        start_date: nextStart.toISOString().slice(0, 10),
        end_date: nextEnd.toISOString().slice(0, 10),
        prize: "치킨 1마리",
        winner_count: 10,
        status: "active",
      });

      results.push({
        round_number: round.round_number,
        winners: winners.length,
        winner_ids: winners,
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
