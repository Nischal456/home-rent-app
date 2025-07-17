import { NextResponse as TenantDeleteResponse } from 'next/server';
import dbConnectDelete from '@/lib/dbConnect';
import UserDelete from '@/models/User';
import RoomDelete from '@/models/Room';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';

export async function DELETE(request: Request, { params }: { params: { tenantId: string } }) {
  await dbConnectDelete();
  try {
    const { tenantId } = params;
    
    const tenant = await UserDelete.findById(tenantId);
    if (!tenant) {
      return TenantDeleteResponse.json({ success: false, message: 'Tenant not found.' }, { status: 404 });
    }

    // Unassign the room if the tenant has one
    if (tenant.roomId) {
      await RoomDelete.findByIdAndUpdate(tenant.roomId, { $unset: { tenantId: 1 } });
    }

    // Delete all bills associated with the tenant
    await RentBill.deleteMany({ tenantId: tenantId });
    await UtilityBill.deleteMany({ tenantId: tenantId });
    
    // Finally, delete the tenant user
    await UserDelete.findByIdAndDelete(tenantId);

    return TenantDeleteResponse.json({ success: true, message: 'Tenant and all associated data deleted successfully.' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return TenantDeleteResponse.json({ success: false, message: 'Error deleting tenant' }, { status: 500 });
  }
}
