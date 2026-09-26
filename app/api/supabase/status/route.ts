// app/api/supabase/status/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/server/supabase';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    if (!supabaseUrl || !hasKey) {
      return NextResponse.json({
        configured: false,
        error: 'Supabase URL or Key missing in environment.',
      });
    }

    // Check hotels table
    const { data: hotelsData, error: hotelsErr } = await supabaseServer.from('hotels').select('id, name, slug').limit(5);

    if (hotelsErr) {
      const isMissingTable = hotelsErr.code === 'PGRST205' || hotelsErr.message?.includes('schema cache');
      return NextResponse.json({
        configured: true,
        connected: true,
        tablesExist: false,
        code: hotelsErr.code,
        message: isMissingTable
          ? 'Supabase connection is ACTIVE, but schema tables are not created yet. Run db/supabase_complete_schema.sql in Supabase SQL Editor.'
          : hotelsErr.message,
      });
    }

    // Tables exist! Count data
    const [roomsRes, staysRes, menuRes, ordersRes] = await Promise.all([
      supabaseServer.from('rooms').select('id', { count: 'exact', head: true }),
      supabaseServer.from('stays').select('id', { count: 'exact', head: true }),
      supabaseServer.from('menu_items').select('id', { count: 'exact', head: true }),
      supabaseServer.from('orders').select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      configured: true,
      connected: true,
      tablesExist: true,
      counts: {
        hotels: hotelsData?.length || 0,
        rooms: roomsRes.count || 0,
        stays: staysRes.count || 0,
        menuItems: menuRes.count || 0,
        orders: ordersRes.count || 0,
      },
      hotels: hotelsData || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error testing Supabase status';
    return NextResponse.json({
      configured: true,
      connected: false,
      error: message,
    }, { status: 500 });
  }
}
