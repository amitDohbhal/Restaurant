"use client"
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Check, X, Clock, AlertCircle, ChevronDown, Loader2, Bell, Plus, Trash2, Filter, RotateCcw, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
export default function RunningOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null
  });

  // Apply filters whenever orders or filter states change
  useEffect(() => {
    let result = [...orders];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.orderNumber.toLowerCase().includes(term) ||
        (order.customer?.name?.toLowerCase().includes(term)) ||
        (order.customer?.phone?.includes(term))
      );
    }
    
    // Apply room filter
    if (selectedRoom !== 'all') {
      result = result.filter(order => order.customer?.roomNumber === selectedRoom);
    }
    
    // Apply date range filter
    if (dateRange.from && dateRange.to) {
      result = result.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dateRange.from && orderDate <= dateRange.to;
      });
    }
    
    setFilteredOrders(result);
  }, [orders, searchTerm, selectedRoom, dateRange]);
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRoom('all');
    setDateRange({ from: null, to: null });
  };

  // Polling interval in milliseconds (e.g., 5000ms = 5 seconds)
  const POLLING_INTERVAL = 30000;

  // Fetch orders with polling
  useEffect(() => {
    let pollInterval;

    // Initial fetch
    fetchOrders();

    // Set up polling
    pollInterval = setInterval(fetchOrders, POLLING_INTERVAL);

    // Clean up interval on component unmount
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);
  // useEffect(() => {
  //   fetchOrders()
  // }, [])

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/runningOrder');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch orders');
      }

      const { data } = await response.json();
      // console.log(data)
      
      // Check for new orders
      if (orders.length > 0 && data?.length > 0) {
        const newOrders = data.filter(
          newOrder => !orders.some(existingOrder => existingOrder._id === newOrder._id)
        );
        // console.log(newOrders)
        
        // Show toast for each new order
        newOrders.forEach(order => {
          const customerName = order.customer?.name || 'Guest';
          const roomNumber = order.customer?.roomNumber ? `(Room ${order.customer.roomNumber})` : '';
          const itemCount = order.items?.length || 0;
          const totalAmount = order.total || 0;
          
          toast.success(
            <div className="space-y-1">
              <p className="font-medium">New Order #{order.orderNumber || order._id}</p>
              <p className="text-sm">{customerName} {roomNumber}</p>
              <p className="text-sm">{itemCount} items • ₹{totalAmount.toFixed(2)}</p>
            </div>,
            {
              duration: 8000,
              position: 'top-right',
              icon: '🍽️',
              style: {
                borderLeft: '4px solid #10B981',
                minWidth: '250px'
              },
            }
          );
        });
      }
      
      setOrders(data || []);
    } catch (error) {
      console.error('Error in fetchOrders:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const statusVariants = {
    pending: { label: 'Pending', variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    preparing: { label: 'Preparing', variant: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    ready: { label: 'Ready for Delivery', variant: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    completed: { label: 'Completed', variant: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
    cancelled: { label: 'Cancelled', variant: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  };

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [isUpdating, setIsUpdating] = useState(false);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setIsUpdating(true);
      // console.log(`Updating order ${orderId} to status: ${newStatus}`);

      // Make API call to update status
      const response = await fetch('/api/runningOrder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('API Error Response:', responseData);
        throw new Error(
          responseData.message || 
          `Failed to update order status (${response.status} ${response.statusText})`
        );
      }

      // Update local state with the updated order
      setOrders(prev =>
        prev.map(order =>
          (order._id === orderId || order.id === orderId)
            ? { ...order, status: newStatus }
            : order
        )
      );

      // Update selected order if it's the one being updated
      setSelectedOrder(prev => 
        prev && (prev._id === orderId || prev.id === orderId)
          ? { ...prev, status: newStatus }
          : prev
      );

      toast.success(`Order #${orderId} has been marked as ${newStatus}.`);
      // console.log('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', {
        error,
        orderId,
        newStatus,
        time: new Date().toISOString()
      });
      
      toast.error(`Failed to update order: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = statusVariants[status] || statusVariants.pending;
    return (
      <Badge className={`${statusInfo.variant} capitalize`}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Running Orders</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage and track all food orders in real-time
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-1">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by order ID or guest..."
                  className="w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="room">Room Number</Label>
                <Select 
                  value={selectedRoom} 
                  onValueChange={setSelectedRoom}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rooms</SelectItem>
                    {Array.from(new Set(orders
                      .map(order => order.customer?.roomNumber)
                      .filter(room => room) // Filter out undefined/null
                    )).map(room => (
                      <SelectItem key={room} value={room}>Room {room}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label>Date Range</Label>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, y')}
                            </>
                          ) : (
                            <>{format(dateRange.from, 'MMM d, y')}</>
                          )
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    // The filters are applied automatically via the useEffect
                    toast.success('Filters applied');
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Reset filters"
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border
            ">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead colSpan="6" className="text-right text-sm text-muted-foreground">
                    Showing {filteredOrders.length} of {orders.length} orders
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => (
                    <TableRow key={`${order._id || 'order'}-${order.id || ''}-${index}`}>
                      <TableCell className="font-medium">{order.orderNumber || 'N/A'}</TableCell>
                      <TableCell>{order.customer?.name || 'N/A'}</TableCell>
                      <TableCell>{order.customer?.roomNumber || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="text-wrap w-64">
                          {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                        </div>
                      </TableCell>
                      <TableCell>₹{order.total.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl ">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder.orderNumber}</DialogTitle>
                <div className="mt-2">
                  {getStatusBadge(selectedOrder.status)}
                  <div className="text-sm text-muted-foreground mt-1">
                    Placed {formatDistanceToNow(new Date(selectedOrder.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </DialogHeader>
              <div className="h-[75vh] overflow-y-auto">
     

              {/* Customer Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">CUSTOMER DETAILS</h4>
                    <p className="font-medium">{selectedOrder.customer?.name || 'N/A'}</p>
                    {selectedOrder.customer?.email && (
                      <p className="text-sm text-gray-600">{selectedOrder.customer.email}</p>
                    )}
                    {selectedOrder.customer?.phone && (
                      <p className="text-sm text-gray-600">{selectedOrder.customer.phone}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">ROOM DETAILS</h4>
                    <p className="font-medium">Room {selectedOrder.customer?.roomNumber || 'N/A'}</p>
                    {selectedOrder.customer?.checkIn && (
                      <p className="text-sm text-gray-600">
                        Check-in: {new Date(selectedOrder.customer.checkIn).toLocaleDateString()}
                      </p>
                    )}
                    {selectedOrder.customer?.checkOut && (
                      <p className="text-sm text-gray-600">
                        Check-out: {new Date(selectedOrder.customer.checkOut).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                </div>

                {/* Order Information */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">ORDER INFORMATION</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm"><span className="text-gray-500">Order Type:</span> {selectedOrder.orderType || 'N/A'}</p>
                      <p className="text-sm"><span className="text-gray-500">Order Status:</span> {selectedOrder.status || 'N/A'}</p>
                      <p className="text-sm"><span className="text-gray-500">Payment Status:</span> {selectedOrder.paymentStatus || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm"><span className="text-gray-500">Order Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                      {selectedOrder.notes && (
                        <p className="text-sm"><span className="text-gray-500">Notes:</span> {selectedOrder.notes}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 py-2">
                  <div className="border rounded-lg">
                    <div className="p-4 bg-muted/50">
                      <h4 className="font-medium">Order Items</h4>
                    </div>
                    <div className="divide-y">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="p-4 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.quantity}x {item.name}</p>
                            {item.specialInstructions && (
                              <p className="text-sm text-muted-foreground">
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                          <div className="font-medium">
                          ₹{(item.quantity * item.price).toFixed(2)}
                          </div>
                        </div>
                      ))}
                      {/* Subtotal */}
                      <div className="p-2 px-4 flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{(selectedOrder.total - (selectedOrder.tax || 0)).toFixed(2)}</span>
                      </div>
                      
                      {/* Tax Breakdown */}
                      {selectedOrder.tax > 0 && (
                        <div className="py-2 space-y-1">                         
                          {/* CGST */}
                          {selectedOrder.items.some(item => item.cgst > 0 || item.cgstAmount > 0) && (
                            <div className="space-y-1 px-3">
                              <div className="flex justify-between">
                                <span className="text-black">CGST</span>
                                <span>₹{selectedOrder.items.reduce((sum, item) => sum + (item.cgstAmount || 0), 0).toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* SGST */}
                          {selectedOrder.items.some(item => item.sgst > 0 || item.sgstAmount > 0) && (
                            <div className="space-y-1 px-3">
                              <div className="flex justify-between">
                                <span className="text-black">SGST</span>
                                <span>₹{selectedOrder.items.reduce((sum, item) => sum + (item.sgstAmount || 0), 0).toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Total */}
                      <div className="p-4 border-t flex justify-between font-bold">
                        <span>Total</span>
                        <span>  ₹{selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                           
              </div>

                <DialogFooter className="sm:justify-between">
                  <div>
                    {selectedOrder.status === 'pending' && (
                      <Button
                        variant="destructive"
                        onClick={() => updateOrderStatus(selectedOrder._id || selectedOrder.id, 'cancelled')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Processing...' : 'Reject Order'}
                      </Button>
                    )}
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedOrder(null)}
                      disabled={isUpdating}
                    >
                      Close
                    </Button>
                    {selectedOrder.status === 'pending' && (
                      <Button
                        onClick={() => updateOrderStatus(selectedOrder._id || selectedOrder.id, 'preparing')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Processing...' : 'Accept Order'}
                      </Button>
                    )}
                    {selectedOrder.status === 'preparing' && (
                      <Button
                        onClick={() => updateOrderStatus(selectedOrder._id || selectedOrder.id, 'ready')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Updating...' : 'Mark as Ready'}
                      </Button>
                    )}
                    {selectedOrder.status === 'ready' && (
                      <Button
                        onClick={() => updateOrderStatus(selectedOrder._id || selectedOrder.id, 'completed')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Updating...' : 'Complete Delivery'}
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </>
            )}
            </DialogContent>
      </Dialog>
    </div>
  );
};