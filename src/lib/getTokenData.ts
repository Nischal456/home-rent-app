import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'TENANT';
  fullName: string;
}

export const getTokenData = (request: Request): TokenPayload | null => {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) throw new Error('No cookie header found');
    
    const token = cookieHeader.split('; ').find(c => c.startsWith('token='))?.split('=')[1];
    if (!token) throw new Error('Authentication token not found.');

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    return decodedToken;
  } catch (error: any) {
    console.error('Error decoding token:', error.message);
    return null;
  }
};
