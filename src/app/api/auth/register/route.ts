import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  await dbConnect(); // Ensure database is connected

  try {
    const { fullName, email, password, role } = await request.json();

    // Check if a user with the same email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'TENANT', // Default to TENANT if role is not provided
    });

    // Save the new user to the database
    await newUser.save();

    return NextResponse.json(
      { success: true, message: 'User registered successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { success: false, message: 'Error registering user' },
      { status: 500 }
    );
  }
}
