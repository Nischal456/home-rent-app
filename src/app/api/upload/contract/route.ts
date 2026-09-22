import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    if (!cloud_name || !api_key || !api_secret) {
      return NextResponse.json(
        { success: false, message: 'Cloudinary credentials not configured in .env.local' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const sanitizedBaseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);

    // Upload using Cloudinary upload_stream
    const uploadResult: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'stg_tenant_contracts',
          resource_type: 'auto',
          public_id: `contract_${Date.now()}_${sanitizedBaseName}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url || uploadResult.url,
      name: file.name,
      format: uploadResult.format || (isPdf ? 'pdf' : 'image'),
      size: uploadResult.bytes || file.size,
    });
  } catch (error: any) {
    console.error('Cloudinary contract upload error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to upload contract to Cloudinary' },
      { status: 500 }
    );
  }
}
