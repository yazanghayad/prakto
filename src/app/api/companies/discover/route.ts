import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

// GET /api/companies/discover — list approved companies with active internship counts
export async function GET(request: NextRequest) {
  try {
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry') || '';
    const city = searchParams.get('city') || '';

    // Build company query
    const queries: string[] = [
      Query.limit(limit),
      Query.offset((page - 1) * limit),
      Query.orderDesc('$createdAt')
    ];

    if (search) {
      queries.push(Query.search('companyName', search));
    }
    if (industry) {
      queries.push(Query.equal('industry', industry));
    }
    if (city) {
      queries.push(Query.equal('city', city));
    }

    const companyRes = await databases.listDocuments(DATABASE_ID, 'companies', queries);

    // Get internship counts for each company
    const companyIds = companyRes.documents.map((c) => c.$id);
    const internshipCounts: Record<string, number> = {};

    if (companyIds.length > 0) {
      // Fetch published internships for these companies
      const internshipRes = await databases.listDocuments(DATABASE_ID, 'internships', [
        Query.equal('companyId', companyIds),
        Query.equal('status', 'published'),
        Query.limit(500),
        Query.select(['companyId'])
      ]);

      for (const doc of internshipRes.documents) {
        const cid = doc.companyId as string;
        internshipCounts[cid] = (internshipCounts[cid] || 0) + 1;
      }
    }

    // Build logo URL helper
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
    const bucketId = 'logos';

    const companies = companyRes.documents.map((doc) => ({
      $id: doc.$id,
      companyName: doc.companyName,
      industry: doc.industry,
      description: doc.description,
      city: doc.city,
      website: doc.website,
      logoUrl: doc.logoFileId
        ? `${endpoint}/storage/buckets/${bucketId}/files/${doc.logoFileId}/preview?project=${projectId}&width=200&height=200`
        : null,
      coverUrl: doc.coverFileId
        ? `${endpoint}/storage/buckets/${bucketId}/files/${doc.coverFileId}/preview?project=${projectId}&width=600&height=300`
        : null,
      activeInternships: internshipCounts[doc.$id] || 0
    }));

    return NextResponse.json({
      total: companyRes.total,
      companies
    });
  } catch {
    return NextResponse.json({ error: 'Kunde inte hämta företag.' }, { status: 500 });
  }
}
