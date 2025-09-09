"use client"
import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Search, User, Phone, Home, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';

const CheckOutGuest = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/addGuestToRoom?search=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error('Failed to search guests');
      
      const guests = await response.json();
      // Filter for checked-in guests only
      const checkedInGuests = guests.filter(guest => guest.status === 'checked-in');
      setSearchResults(checkedInGuests);
      
      if (checkedInGuests.length === 0) {
        toast.error('No checked-in guests found matching your search');
      }
    } catch (error) {
      console.error('Error searching guests:', error);
      toast.error('Failed to search guests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedGuest) return;
    
    setIsCheckingOut(true);
    try {
      const response = await fetch(`/api/addGuestToRoom`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedGuest._id,
          status: 'checked-out',
          actualCheckOut: new Date().toISOString(),
          roomId: selectedGuest.roomId,
        })
      });
      
      if (!response.ok) throw new Error('Failed to process checkout');
      
      // Update local state
      setSearchResults(prev => prev.filter(guest => guest._id !== selectedGuest._id));
      setSelectedGuest(null);
      setSearchTerm('');
      setShowCheckoutConfirm(false);
      
      toast.success('Guest checked out successfully');
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Failed to process checkout');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Reset form is no longer needed as we're handling state updates directly

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Check Out Guest</CardTitle>
          <CardDescription>
            Search for a guest by name, room number, or phone number to process checkout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, room number, or phone"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !searchTerm.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {searchResults.length} guest{searchResults.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((guest) => (
                <div 
                  key={guest._id}
                  className={`p-4 border rounded-lg ${
                    selectedGuest?._id === guest._id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{guest.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{guest.phone || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span>Room {guest.roomNumber} - {guest.roomType || 'Standard'}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Check-in: {guest.checkIn ? format(parseISO(guest.checkIn), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSelectedGuest(guest);
                        setShowCheckoutConfirm(true);
                      }}
                      className="whitespace-nowrap"
                    >
                      Check Out
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkout Confirmation Dialog */}
      <Dialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Checkout</DialogTitle>
            <DialogDescription>
              Are you sure you want to check out {selectedGuest?.name} from Room {selectedGuest?.roomNumber}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between">
              <span>Check-in Date:</span>
              <span>{selectedGuest?.checkIn ? format(parseISO(selectedGuest.checkIn), 'MMM d, yyyy') : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Scheduled Check-out:</span>
              <span>{selectedGuest?.checkOut ? format(parseISO(selectedGuest.checkOut), 'MMM d, yyyy') : 'N/A'}</span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                This will mark the room as available for new guests.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCheckoutConfirm(false)}
              disabled={isCheckingOut}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : 'Confirm Checkout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckOutGuest;