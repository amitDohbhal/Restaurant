"use client"
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Search, User, Mail, Phone, Home, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Sample data - replace with your actual data fetching logic
const sampleGuestData = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    roomNumber: '101',
    roomType: 'Deluxe',
    checkInDate: new Date('2025-09-01'),
    checkOutDate: new Date('2025-09-08'),
    address: '123 Main St, New York, NY',
    idProof: 'A1234567',
    idType: 'Passport',
    totalBill: 1050.00,
    paidAmount: 500.00,
    balanceDue: 550.00,
    status: 'checked-in',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1 (555) 987-6543',
    roomNumber: '201',
    roomType: 'Suite',
    checkInDate: new Date('2025-09-05'),
    checkOutDate: new Date('2025-09-12'),
    address: '456 Park Ave, New York, NY',
    idProof: 'B7654321',
    idType: 'Driver\'s License',
    totalBill: 1800.00,
    paidAmount: 1000.00,
    balanceDue: 800.00,
    status: 'checked-in',
  },
];

const CheckOutGuest = () => {
  const [roomNumber, setRoomNumber] = useState('');
  const [guestData, setGuestData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const handleSearch = () => {
    if (!roomNumber.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const foundGuest = sampleGuestData.find(
        guest => guest.roomNumber === roomNumber && guest.status === 'checked-in'
      );
      setGuestData(foundGuest || null);
      setIsLoading(false);
    }, 500);
  };

  const handleCheckout = () => {
    // Simulate checkout process
    setTimeout(() => {
      setCheckoutSuccess(true);
      setShowCheckoutConfirm(false);
      // In a real app, you would update the room status and guest record here
    }, 1000);
  };

  const resetForm = () => {
    setRoomNumber('');
    setGuestData(null);
    setCheckoutSuccess(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Check Out Guest</CardTitle>
          <CardDescription>
            Enter room number to view guest details and process checkout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Enter room number"
                className="pl-9"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading || !roomNumber.trim()}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {guestData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Guest Details</CardTitle>
                <CardDescription>Room {guestData.roomNumber} - {guestData.roomType}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDetails(true)}>
                  View Full Details
                </Button>
                <Button 
                  onClick={() => setShowCheckoutConfirm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Process Checkout
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Guest Information</h3>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{guestData.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{guestData.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{guestData.phone}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Stay Details</h3>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span>Room {guestData.roomNumber} - {guestData.roomType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Check-in: {format(new Date(guestData.checkInDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Check-out: {format(new Date(guestData.checkOutDate), 'MMM d, yyyy')}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Billing</h3>
                <div className="flex justify-between">
                  <span>Total Bill:</span>
                  <span>${guestData.totalBill.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid Amount:</span>
                  <span>${guestData.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Balance Due:</span>
                  <span>${guestData.balanceDue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guest Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Guest Details</DialogTitle>
            <DialogDescription>
              Complete information for {guestData?.name}
            </DialogDescription>
          </DialogHeader>
          {guestData && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Personal Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">Name:</span> {guestData.name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {guestData.email}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {guestData.phone}</p>
                    <p><span className="text-muted-foreground">Address:</span> {guestData.address}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Identification</h4>
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">ID Type:</span> {guestData.idType}</p>
                    <p><span className="text-muted-foreground">ID Number:</span> {guestData.idProof}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Billing Details</h4>
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Room Charges ({guestData.roomType}):</span>
                    <span>${(guestData.totalBill - 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Additional Services:</span>
                    <span>$100.00</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total Amount:</span>
                      <span>${guestData.totalBill.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Paid Amount:</span>
                      <span>${guestData.paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-2">
                      <span>Balance Due:</span>
                      <span>${guestData.balanceDue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <DialogTitle>Confirm Checkout</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to check out {guestData?.name} from Room {guestData?.roomNumber}?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              <strong>Note:</strong> This action cannot be undone. Please ensure all payments are settled before proceeding.
            </p>
            {guestData?.balanceDue > 0 && (
              <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                Outstanding balance of ${guestData.balanceDue.toFixed(2)} needs to be collected.
              </p>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setShowCheckoutConfirm(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Message */}
      {checkoutSuccess && (
        <div className="fixed bottom-4 right-4">
          <div className="bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>Guest checked out successfully!</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-green-600 h-8 px-2"
              onClick={resetForm}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckOutGuest;