import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';
import { generateHeuristicReportPdfLib, toAiBreakdown } from '@/lib/systemGeneratedReport/heuristicReportPdfLib';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const designVersion = searchParams.get('designVersion');
    if (!designVersion) {
      return NextResponse.json({ error: 'Missing designVersion' }, { status: 400 });
    }

    const supabase = createClient();

    const { data: aiRow, error } = await supabase
      .from('design_versions')
      .select('*')
      .eq('design_version', designVersion)
      .single();

    if (error) {
      console.error('Supabase error fetching design_versions:', error);
      return NextResponse.json({ error: 'Failed to fetch design version' }, { status: 500 });
    }

    if (!aiRow) {
      return NextResponse.json({ error: 'Design version not found' }, { status: 404 });
    }

    // Try common field names that may hold the AI JSON
    const aiPayload = aiRow.ai_data ?? aiRow.payload ?? aiRow.ai ?? null;
    if (!aiPayload?.ai?.heuristic_breakdown) {
      return NextResponse.json({ error: 'No AI heuristic_breakdown for this designVersion' }, { status: 404 });
    }

    const aiBreakdown = toAiBreakdown(aiPayload);
    if (!aiBreakdown.length) {
      return NextResponse.json({ error: 'Empty AI heuristic_breakdown' }, { status: 404 });
    }

    const radarData = aiBreakdown.map(h => ({
      key: h.code,
      name: h.principle,
      score: Math.round((h.score / h.max_points) * 100),
    }));

    const pdfBytes = await generateHeuristicReportPdfLib(radarData, {
      title: 'Heuristic Violation Report',
      project: 'UXhibit',
      version: designVersion,
      includeLegend: true,
      includeDetails: false,
      includeAiBreakdown: true,
      aiBreakdown,
    });

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="heuristics-report.pdf"',
      },
    });
  } catch (err) {
    console.error('Unhandled error generating heuristics report:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}