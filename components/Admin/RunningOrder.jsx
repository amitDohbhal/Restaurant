"use client"
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, Clock, AlertCircle, ChevronDown, Loader2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from "react-hot-toast"

// Sample data - replace with your actual data fetching logic
const sampleOrders = [
  {
    id: 'ORD-1001',
    guestName: 'John Doe',
    roomNumber: '101',
    status: 'pending', // pending, preparing, ready, completed, cancelled
    items: [
      { id: 1, name: 'Margherita Pizza', quantity: 1, price: 12.99, specialInstructions: 'Extra cheese, no basil' },
      { id: 2, name: 'Caesar Salad', quantity: 2, price: 8.99 },
      { id: 3, name: 'Coke', quantity: 2, price: 2.50 },
    ],
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    total: 36.46,
    notes: 'Please send with extra napkins',
  },
  {
    id: 'ORD-1002',
    guestName: 'Jane Smith',
    roomNumber: '205',
    status: 'preparing',
    items: [
      { id: 4, name: 'Chicken Alfredo Pasta', quantity: 1, price: 15.99 },
      { id: 5, name: 'Garlic Bread', quantity: 1, price: 4.99 },
    ],
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    total: 22.48,
  },
];

const statusVariants = {
  pending: { label: 'Pending', variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  preparing: { label: 'Preparing', variant: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  ready: { label: 'Ready for Delivery', variant: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  completed: { label: 'Completed', variant: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  cancelled: { label: 'Cancelled', variant: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

const RunningOrder = () => {
  const [orders, setOrders] = useState(sampleOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    // Initial load
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Simulate new order every 30 seconds
      const newOrderInterval = setInterval(() => {
        const newOrder = {
          id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          guestName: ['Alex', 'Sam', 'Taylor', 'Jordan', 'Casey'][Math.floor(Math.random() * 5)],
          roomNumber: `${Math.floor(100 + Math.random() * 400)}`,
          status: 'pending',
          items: [
            {
              id: Math.floor(Math.random() * 1000),
              name: ['Pizza', 'Pasta', 'Burger', 'Salad', 'Sandwich'][Math.floor(Math.random() * 5)],
              quantity: Math.floor(Math.random() * 3) + 1,
              price: parseFloat((5 + Math.random() * 20).toFixed(2)),
            },
          ],
          createdAt: new Date(),
          total: parseFloat((10 + Math.random() * 50).toFixed(2)),
        };
        
        setOrders(prev => [newOrder, ...prev]);
        
        // Show toast notification for new order
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">New Order Received</p>
                  <p className="mt-1 text-sm text-gray-500">Order #{newOrder.id} from Room {newOrder.roomNumber}</p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  setSelectedOrder(newOrder);
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                View
              </button>
            </div>
          </div>
        ), {
          duration: 5000,
        });
      }, 30000);

      return () => clearInterval(newOrderInterval);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const updateOrderStatus = (orderId, newStatus) => {
    setIsUpdating(true);
    
    // Simulate API call
    setTimeout(() => {
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus } 
            : order
        )
      );
      
      setSelectedOrder(prev => prev?.id === orderId ? { ...prev, status: newStatus } : prev);
      
      toast.success(`Order #${orderId} has been ${newStatus}.`);
      
      setIsUpdating(false);
    }, 800);
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Running Orders</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage and track all food orders in real-time
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                Filter <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border
            ">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.guestName}</TableCell>
                      <TableCell>{order.roomNumber}</TableCell>
                      <TableCell>
                        <div className="line-clamp-1">
                          {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                        </div>
                      </TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
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
        <DialogContent className="max-w-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder.id}</DialogTitle>
                <DialogDescription>
                  Room {selectedOrder.roomNumber} • {selectedOrder.guestName}
                </DialogDescription>
                <div className="mt-2">
                  {getStatusBadge(selectedOrder.status)}
                  <div className="text-sm text-muted-foreground mt-1">
                    Placed {formatDistanceToNow(new Date(selectedOrder.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <div className="border rounded-lg">
                  <div className="p-4 bg-muted/50">
                    <h4 className="font-medium">Order Items</h4>
                  </div>
                  <div className="divide-y">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.quantity}x {item.name}</p>
                          {item.specialInstructions && (
                            <p className="text-sm text-muted-foreground">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <div className="font-medium">
                          ${(item.quantity * item.price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                    <div className="p-4 border-t flex justify-between font-bold">
                      <span>Total</span>
                      <span>${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                    <h4 className="font-medium flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                      <AlertCircle className="h-4 w-4" />
                      Special Instructions
                    </h4>
                    <p className="mt-1 text-sm">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="sm:justify-between">
                <div>
                  {selectedOrder.status === 'pending' && (
                    <Button 
                      variant="destructive" 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
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
                      onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Processing...' : 'Accept Order'}
                    </Button>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <Button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Mark as Ready'}
                    </Button>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <Button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
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

export default RunningOrder;