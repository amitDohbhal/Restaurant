"use client"
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
  },
  // Add more sample data as needed
];

const ViewGuestStayingInRoom = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    from: undefined,
    to: undefined,
  });
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Filter guests based on search term and date range
  const filteredGuests = sampleGuestData.filter((guest) => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.roomNumber.includes(searchTerm);
    
    if (!dateFilter.from && !dateFilter.to) {
      return matchesSearch;
    }

    const checkIn = new Date(guest.checkInDate);
    const checkOut = new Date(guest.checkOutDate);
    const filterFrom = dateFilter.from ? new Date(dateFilter.from) : null;
    const filterTo = dateFilter.to ? new Date(dateFilter.to) : null;

    if (filterFrom && filterTo) {
      return matchesSearch && (
        (checkIn >= filterFrom && checkIn <= filterTo) ||
        (checkOut >= filterFrom && checkOut <= filterTo) ||
        (checkIn <= filterFrom && checkOut >= filterTo)
      );
    }
    
    if (filterFrom) {
      return matchesSearch && checkOut >= filterFrom;
    }
    
    if (filterTo) {
      return matchesSearch && checkIn <= filterTo;
    }
    
    return matchesSearch;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter({ from: undefined, to: undefined });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Guest Stays</CardTitle>
            <CardDescription>View and manage current and upcoming guest stays</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or room..."
                className="pl-9 w-full md:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {dateFilter.from || dateFilter.to ? (
                    <>
                      {dateFilter.from && format(dateFilter.from, 'MMM d')}
                      {dateFilter.to && ` - ${format(dateFilter.to, 'MMM d, yyyy')}`}
                    </>
                  ) : (
                    'Filter by date'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateFilter.from || new Date()}
                  selected={{ from: dateFilter.from, to: dateFilter.to }}
                  onSelect={(range) => {
                    setDateFilter({
                      from: range?.from,
                      to: range?.to,
                    });
                  }}
                  numberOfMonths={2}
                />
                <div className="p-4 border-t flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFilter({ from: undefined, to: undefined });
                      setShowDateFilter(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowDateFilter(false)}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            {(searchTerm || dateFilter.from || dateFilter.to) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuests.length > 0 ? (
                filteredGuests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        <div>{guest.email}</div>
                        <div>{guest.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">Room {guest.roomNumber}</div>
                      <div className="text-sm text-muted-foreground">{guest.roomType}</div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(guest.checkInDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(guest.checkOutDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        new Date(guest.checkInDate) <= new Date() && new Date(guest.checkOutDate) >= new Date()
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      )}>
                        {new Date(guest.checkInDate) <= new Date() && new Date(guest.checkOutDate) >= new Date()
                          ? 'Currently Staying'
                          : 'Upcoming Stay'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No guests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ViewGuestStayingInRoom;