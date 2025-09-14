"use client"
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Loader2, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const AddGuestToRoom = () => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [rooms, setRooms] = useState([]);
    const [guests, setGuests] = useState([]);
    const [formData, setFormData] = useState({
        roomId: '',
        roomNumber: '',
        roomType:'',
        name: '',
        email: '',
        phone: '',
        checkIn: undefined,
        checkOut: undefined,
    });
    const fetchRoomsData = async () => {
        try {
            setIsLoading(true);
            // Fetch rooms
            const roomsResponse = await fetch('/api/roomInfo');
            if (!roomsResponse.ok) throw new Error('Failed to fetch rooms');
            const roomsData = await roomsResponse.json();
            setRooms(roomsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };
    const fetchGuestsData = async () => {
        try {
            setIsLoading(true);
            // Fetch guests
            const guestsResponse = await fetch('/api/addGuestToRoom');
            if (!guestsResponse.ok) throw new Error('Failed to fetch guests');
            const guestsData = await guestsResponse.json();
            setGuests(guestsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };
    // Fetch rooms and guests data
    useEffect(() => {
        fetchRoomsData();
        fetchGuestsData();
    }, []);

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRoomSelect = (roomId) => {
        const selectedRoom = rooms.find(room => room._id === roomId);
        if (selectedRoom) {
            setFormData(prev => ({
                ...prev,
                roomId: selectedRoom._id,
                roomNumber: selectedRoom.RoomNo,
                roomType: selectedRoom.type
            }));
        }
    };

    //     // Scroll to form
    //     document.getElementById('guest-form')?.scrollIntoView({ behavior: 'smooth' });
    //   };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.roomId) {
            toast.error('Please select a room');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/addGuestToRoom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    roomId: formData.roomId,
                    roomNumber: formData.roomNumber,
                    roomType: formData.roomType,
                    checkIn: formData.checkIn?.toISOString(),
                    checkOut: formData.checkOut?.toISOString()
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add guest');
            }

            fetchGuestsData();

            // Reset form
            setFormData({
                roomId: '',
                roomNumber: '',
                roomType:'',
                name: '',
                email: '',
                phone: '',
                checkIn: undefined,
                checkOut: undefined,
            });

            toast.success('Guest added successfully!');
        } catch (error) {
            console.error('Error adding guest:', error);
            toast.error(error.message || 'Failed to add guest');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Add Guest to Room</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Room Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="room">Select Room</Label>
                            {isLoading ? (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <Select
                                    value={formData.roomId}
                                    onValueChange={handleRoomSelect}
                                    disabled={isLoading}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={
                                            isLoading ? 'Loading rooms...' : 'Select a room'
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map((room) => (
                                            <SelectItem key={room._id} value={room._id}>
                                                Room {room.RoomNo} - {room.type} {!room.active && '(Unavailable)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Guest Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Guest Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder="Enter Guest Name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="Enter Guest Email"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="Enter Guest Phone Number"
                                    required
                                />
                            </div>
                        </div>

                        {/* Check-in/Check-out Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Check-in Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !formData.checkIn && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.checkIn ? (
                                                format(formData.checkIn, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.checkIn}
                                            onSelect={(date) => handleChange('checkIn', date)}
                                            initialFocus
                                            fromDate={new Date()}
                                            required
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Check-out Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !formData.checkOut && "text-muted-foreground"
                                            )}
                                            disabled={!formData.checkIn}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.checkOut ? (
                                                format(formData.checkOut, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.checkOut}
                                            onSelect={(date) => handleChange('checkOut', date)}
                                            initialFocus
                                            disabled={(date) =>
                                                date <= (formData.checkIn || new Date())
                                            }
                                            fromDate={formData.checkIn || new Date()}
                                            required
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding Guest...
                                    </>
                                ) : (
                                    'Add Guest to Room'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Guest List Table */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold">Current Guests</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : guests.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No guests found</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Room
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Check-in
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Check-out
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {guests.map((guest) => (
                                        <tr key={guest._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{guest.name}</div>
                                                        <div className="text-sm text-gray-500">{guest.email}</div>
                                                        <div className="text-sm text-gray-500">{guest.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">Room {guest.roomNumber}</div>
                                                <div className="text-sm text-gray-500">{guest.roomType}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(guest.checkIn).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(guest.checkOut).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${guest.status === 'checked-in'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {guest.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AddGuestToRoom;