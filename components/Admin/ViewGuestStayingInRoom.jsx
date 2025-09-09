"use client"
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const ViewGuestStayingInRoom = () => {
  const [guests, setGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    from: undefined,
    to: undefined,
  });
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Fetch guests from API
  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const response = await fetch('/api/addGuestToRoom');
        if (!response.ok) throw new Error('Failed to fetch guests');
        const data = await response.json();
        setGuests(data);
      } catch (error) {
        console.error('Error fetching guests:', error);
        toast.error('Failed to load guest data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuests();
  }, []);

  // Filter guests based on search term and date range
  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = guest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.roomNumber?.includes(searchTerm) ||
      guest.phone?.includes(searchTerm);

    if (!dateFilter.from && !dateFilter.to) {
      return matchesSearch;
    }

    const checkIn = guest.checkIn ? new Date(guest.checkIn) : null;
    const checkOut = guest.checkOut ? new Date(guest.checkOut) : null;

    if (!checkIn || !checkOut) return matchesSearch;

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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredGuests.length > 0 ? (
                filteredGuests.map((guest) => (
                  <TableRow key={guest._id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        <div>{guest.email || 'N/A'}</div>
                        <div>{guest.phone || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">Room {guest.roomNumber}</div>
                      <div className="text-sm text-muted-foreground">{guest.roomType || 'Standard'}</div>
                    </TableCell>
                    <TableCell>
                      {guest.checkIn ? format(parseISO(guest.checkIn), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {guest.checkOut ? format(parseISO(guest.checkOut), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        guest.status === 'checked-in'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      )}>
                        {guest.status === 'checked-in' ? 'Currently Staying' : 'Reserved'}
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