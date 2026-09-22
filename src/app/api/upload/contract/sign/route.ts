import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || '').replace(/^["']|["']$/g, '').trim();
const api_key = (process.env.CLOUDINARY_API_KEY || '').replace(/^["']|["']$/g, '').trim();
const api_secret = (process.env.CLOUDINARY_API_SECRET || '').replace(/^["']|["']$/g, '').trim();

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
  secure: true,
});

export async function GET() {
  try {
    if (!cloud_name || !api_key || !api_secret) {
      return NextResponse.json(
        { success: false, message: 'Cloudinary credentials not configured.' },
        { status: 500 }
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'stg_tenant_contracts';

    // Sign the parameters
    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      api_secret
    );

    return NextResponse.json({
      success: true,
      cloudName: cloud_name,
      apiKey: api_key,
      timestamp,
      folder,
      signature,
    });
  } catch (error: any) {
    console.error('Error creating Cloudinary upload signature:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to sign upload' },
      { status: 500 }
    );
  }
}
