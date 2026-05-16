import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';
import { generateHeuristicReportPdfLib, toAiBreakdown } from '@/lib/systemGeneratedReport/heuristicReportPdfLib';

function normalizeRadarFromAi(aiBreakdown: ReturnType<typeof toAiBreakdown>) {
  return aiBreakdown.map(h => ({
    key: h.code,
    name: h.principle,
    score: Math.round((h.score / h.max_points) * 100),
  }));
}

async function fetchAiPayload(
  supabase: ReturnType<typeof createClient>,
  params: { designId?: string; version?: string; fileKey?: string; nodeId?: string }
) {
  let q = supabase.from('design_versions').select('*');

  if (params.designId && params.version) {
    q = q.eq('design_id', params.designId).eq('version', params.version);
  } else if (params.version) {
    q = q.eq('version', params.version);
  } else if (params.fileKey && params.nodeId) {
    q = q.eq('fileKey', params.fileKey).eq('node_id', params.nodeId);
  } else {
    throw new Error('Missing selector: provide (designId+version), or version, or (fileKey+nodeId).');
  }

  const { data: row, error } = await q.single();
  if (error) throw new Error('Failed to fetch design_versions');
  if (!row) throw new Error('Design version not found');

  const raw = row.ai_data ?? row.ai ?? row.payload ?? null;
  const aiPayload = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return { aiPayload, row };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // expect 'ai'
    const designId = searchParams.get('designId') ?? undefined;
    const version = (searchParams.get('version') ?? searchParams.get('designVersion')) ?? undefined;
    const fileKey = searchParams.get('fileKey') ?? undefined;
    const nodeId = searchParams.get('node_id') ?? undefined;

    if (type !== 'ai') {
      return NextResponse.json({ error: 'Use type=ai with designId+version, version, or fileKey+node_id' }, { status: 400 });
    }

    const supabase = createClient();
    const { aiPayload } = await fetchAiPayload(supabase, { designId, version, fileKey, nodeId });

    if (!aiPayload?.ai?.heuristic_breakdown?.length) {
      return NextResponse.json({ error: 'No AI heuristic_breakdown for the selected design version' }, { status: 404 });
    }

    const aiBreakdown = toAiBreakdown(aiPayload);
    const radarData = aiBreakdown.map(h => ({
      key: h.code,
      name: h.principle,
      score: Math.round((h.score / h.max_points) * 100),
    }));

    const pdfBytes = await generateHeuristicReportPdfLib(radarData, {
      title: 'Heuristic Violation Report',
      project: 'UXhibit',
      version: version,
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
    console.error('Unhandled error generating heuristics report (GET):', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const type: string | undefined = body.type; // 'ai' | 'base'
    const options = body.options ?? {};

    if (type === 'ai') {
      const supabase = createClient();

      // Selectors: prefer designId+version; fallbacks: version, fileKey+nodeId
      const designId: string | undefined = body.designId;
      const version: string | undefined = body.version ?? body.designVersion;
      const fileKey: string | undefined = body.fileKey;
      const nodeId: string | undefined = body.nodeId ?? body.node_id;

      // aiPayload may be provided directly or fetched via selectors
      let aiPayload = body.aiPayload ?? null;
      if (!aiPayload) {
        try {
          const { aiPayload: fetched } = await fetchAiPayload(supabase, { designId, version, fileKey, nodeId });
          aiPayload = fetched;
        } catch (e: any) {
          return NextResponse.json({ error: e?.message ?? 'Failed to fetch design version' }, { status: 400 });
        }
      }

      if (typeof aiPayload === 'string') {
        try {
          aiPayload = JSON.parse(aiPayload);
        } catch {
          return NextResponse.json({ error: 'Invalid aiPayload JSON' }, { status: 400 });
        }
      }

      if (!aiPayload?.ai?.heuristic_breakdown?.length) {
        return NextResponse.json({ error: 'Missing/empty AI heuristic_breakdown' }, { status: 400 });
      }

      const aiBreakdown = toAiBreakdown(aiPayload);
      const radarData = normalizeRadarFromAi(aiBreakdown);

      const pdfBytes = await generateHeuristicReportPdfLib(radarData, {
        title: options.title ?? 'Heuristic Violation Report',
        project: options.project ?? 'UXhibit',
        version: version ?? options.version,
        includeLegend: options.includeLegend ?? true,
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
    }

    // Base (non-AI) report via POST with explicit data
    const data = body.data;
    if (!Array.isArray(data) || !data.length) {
      return NextResponse.json({ error: 'Missing heuristic data array in POST body' }, { status: 400 });
    }

    const pdfBytes = await generateHeuristicReportPdfLib(data, {
      title: options.title ?? 'Heuristic Violation Report',
      project: options.project ?? 'UXhibit',
      version: options.version,
      includeLegend: options.includeLegend ?? true,
      includeDetails: options.includeDetails ?? false,
      includeAiBreakdown: false,
    });

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="heuristics-report.pdf"',
      },
    });
  } catch (err) {
    console.error('Unhandled error generating heuristics report (POST):', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}