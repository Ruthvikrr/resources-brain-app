import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileUrl = searchParams.get('url');

  if (!profileUrl) {
    return NextResponse.json({ error: 'Profile URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(profileUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const name = $('h1').first().text().trim();
    const badgeCount = $('.profile-badge').length;
    
    let badgeTitles: string[] = [];
    $('.profile-badge').each((i, el) => {
      const title = $(el).find('.ql-title-medium').text().trim();
      if (title) badgeTitles.push(title);
    });

    return NextResponse.json({
      name,
      badges: badgeCount,
      titles: badgeTitles,
      success: true
    });
  } catch (error: any) {
    console.error('Error fetching arcade data:', error);
    return NextResponse.json({ error: error.message || 'Unknown error occurred' }, { status: 500 });
  }
}
