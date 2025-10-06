"use client";
import React, { useEffect, useState,useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Menu, X, ChevronLeft, ChevronRight, ChevronLast } from "lucide-react";
import OrderDetail from "./OrderDetail";
import AllOrders from "./AllOrders";
import Chat from "./Chat";

const sections = [
  { key: "orders", label: "Order Overview" },
  // { key: "cancel", label: "Cancel Order" },
  { key: "chatbot", label: "Chat With Admin" },
];
import ChatOrder from "./ChatOrder";


function SectionContent({ section, orderId, onViewOrder, onBackHome, showOrderDetail: initialShowOrderDetail, selectedOrder: initialSelectedOrder, orderChatMode, onChatOrder, onBack, returnOrder }) {
  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(!!orderId);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(initialSelectedOrder || null);
  const [showOrderDetail, setShowOrderDetail] = useState(initialShowOrderDetail || false);
  
  // Update local state when props change
  useEffect(() => {
    if (initialSelectedOrder) {
      setSelectedOrder(initialSelectedOrder);
    }
  }, [initialSelectedOrder]);
  
  useEffect(() => {
    if (initialShowOrderDetail !== undefined) {
      setShowOrderDetail(initialShowOrderDetail);
    }
  }, [initialShowOrderDetail]);

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/runningOrder?orderNumber=${orderId}`);
          const data = await res.json();
          
          if (!res.ok) throw new Error(data.message || 'Failed to fetch order');
          
          // If the response has a data property, use that (for array responses)
          // Otherwise use the response directly (for single order responses)
          const orderData = Array.isArray(data) ? data[0] : data;
          
          setOrder(orderData);
          setError(null);
        } catch (err) {
          console.error('Error fetching order:', err);
          setError(err.message || 'Failed to load order');
        } finally {
          setLoading(false);
        }
      };

      fetchOrder();
    }
  }, [orderId]);

  // Fetch user's orders
  useEffect(() => {
    if (section === 'orders' && !orderId) {
      const fetchUserOrders = async () => {
        try {
          setOrdersLoading(true);
          const res = await fetch('/api/my-orders');
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to fetch your orders');
          }
          
          const ordersData = await res.json();
          console.log('Fetched user orders:', ordersData);
          
          setOrders(Array.isArray(ordersData) ? ordersData : []);
          setError(null);
        } catch (err) {
          console.error('Error fetching user orders:', err);
          setError(err.message || 'Failed to load your orders');
          setOrders([]);
        } finally {
          setOrdersLoading(false);
        }
      };
      
      fetchUserOrders();
    }
  }, [orderId]);
  const { data: session } = useSession()
  if (section === "orders" && selectedOrder && orderChatMode) return <ChatOrder order={selectedOrder} onBack={onBack} onViewOrder={onViewOrder} />;
  if (section === "chatbot") {
    // Get orderId from URL if present
    const searchParams = new URLSearchParams(window.location.search);
    const orderId = searchParams.get('orderId');
    // Pass userId from session to Chat
    const userId = session?.user?.id || session?.user?._id;

    // If we have an orderId, initialize chat with order context
    if (orderId) {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Return Assistance</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>You're chatting about Order #{orderId}. Our team is here to help with your return request.</p>
                </div>
              </div>
            </div>
          </div>
          <Chat userId={userId} context={{ orderId }} />
        </div>
      );
    }
    return <Chat userId={userId} />;
  }
  // Handle close order details modal
  const handleCloseOrderDetails = () => {
    setShowOrderDetail(false);
    // Don't reset selectedOrder here to allow for smooth transitions
  };


  if (section === "orders") {
    // Handle direct order ID in URL
    if (orderId && !showOrderDetail) {
      if (loading) return <div className="p-4 text-center">Loading order details...</div>;
      if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
      if (!order) return <div className="p-4">Order not found</div>;
      
      // Set the selected order and show the modal
      setSelectedOrder(order);
      setShowOrderDetail(true);
    }
    
    return (
      <div className="relative">
        <AllOrders 
          orders={orders}
          loading={ordersLoading}
          error={error}
        />
        
        {/* Order Detail Modal */}
        {showOrderDetail && selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity" 
                aria-hidden="true"
                onClick={() => setShowOrderDetail(false)}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div 
                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <OrderDetail 
                  order={selectedOrder} 
                  onBack={handleCloseOrderDetails} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
const Dashboard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarRef = useRef(null);
    const [ordersCache, setOrdersCache] = useState([]); // Cache for orders
  const [selectedOrder, setSelectedOrder] = useState(null); // Track selected order for modal
  const [showOrderDetail, setShowOrderDetail] = useState(false); // Control modal visibility

  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const pathParts = pathname.split("/");
  const sectionFromUrl = searchParams.get("section") || "dashboard";

  const [activeSection, setActiveSection] = useState(sectionFromUrl);
  const [orderChatMode, setOrderChatMode] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);

  const user = session?.user || {
    name: "User Name",
    email: "user@example.com",
    image: "/placeholder.jpeg",
  };

  // Sync state when section changes
  useEffect(() => {
    setActiveSection(sectionFromUrl);
  }, [sectionFromUrl]);

  // Expose handleReturnOrder to window for OrderDetail
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.handleReturnOrder = handleReturnOrder;
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.handleReturnOrder = null;
      }
    };
  }, []);

  // Sync chat order from URL
  useEffect(() => {
    const chatOrderId = searchParams.get("chatOrderId");
    if (activeSection === "orders" && chatOrderId) {
      // If already set, do nothing
      if (selectedOrder && selectedOrder._id === chatOrderId && orderChatMode) return;
      // Try to find in cache first
      let order = ordersCache.find(o => o._id === chatOrderId);
      if (order) {
        setSelectedOrder(order);
        setOrderChatMode(true);
      } else {
        // Fallback: fetch from API
        fetch(`/api/orders/${chatOrderId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.order) {
              setSelectedOrder(data.order);
              setOrderChatMode(true);
            }
          });
      }
    }
  }, [activeSection, searchParams, selectedOrder, orderChatMode, ordersCache]);

  // Cache orders from AllOrders
  const handleOrdersFetched = (orders) => {
    setOrdersCache(orders || []);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOrderChatMode(false);
    setShowOrderDetail(false);
    setActiveSection("orders");
    router.push("/dashboard?section=orders");
  };

  const handleReturnOrder = (order) => {
    setReturnOrder(order);
    setActiveSection("return");
    router.push(`/dashboard?section=return&orderId=${order._id}`);
  };

  const handleChatOrder = (order) => {
    setSelectedOrder(order);
    setOrderChatMode(true);
    setActiveSection("orders");
    // Add chatOrderId to URL for persistence
    router.push(`/dashboard?section=orders&chatOrderId=${order._id}`);
  };
  const handleBackToOrders = () => {
    setOrderChatMode(false); // or whatever logic returns to the orders list
    setSelectedOrder(null);  // optionally clear the selected order
  };


  const handleBackHome = () => {
    setShowOrderDetail(false);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.delete("orderId");
    router.replace(`/dashboard${params.size ? "?" + params.toString() : ""}`);
  };
    // Close mobile menu when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
          setIsMobileMenuOpen(false);
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

  if (status === "loading") return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#fcf7f1] relative overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-24 -left-1 z-40 p-2 bg-white rounded-lg shadow-md"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <ChevronRight size={24} />}
      </button>
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-2 bottom-2 md:top-0 md:bottom-0 z-30 h-[70vh] my-auto md:static md:h-screen overflow-y-auto w-fit bg-white rounded-2xl shadow-lg m-2 transition-all duration-300 ease-in-out 
          flex flex-col overflow-hidden
          ${isMobileMenuOpen ? '-left-2' : '-left-[300px]'} 
          md:left-0 md:translate-x-0 md:rounded-none md:m-0 md:shadow-lg
          ${isSidebarCollapsed ? 'md:w-24' : 'md:w-72'}
        `}>
           {/* Collapse/Expand button for desktop */}
           <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden md:flex items-center justify-center w-8 h-8 absolute -right-2 top-6 bg-white rounded-full shadow-md z-50"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <div className={`flex flex-col items-center py-4 md:py-8 border-b transition-all duration-300 ${isSidebarCollapsed ? 'px-2' : 'px-6'}`}>
          <div className="w-16 h-16 md:w-20 md:h-20 mb-2 rounded-full border-4 border-white shadow-lg overflow-hidden">
            <Image 
              src={user.image || "/placeholder.jpeg"} 
              alt="avatar" 
              width={80} 
              height={80} 
              className="object-cover w-full h-full" 
            />
          </div>
          {!isSidebarCollapsed && (
            <>
              <div className="font-bold text-sm md:text-lg mt-2 text-center truncate w-full px-2">{user.name}</div>
              <div className="text-red-500 text-xs md:text-sm text-center truncate w-full px-2">{user.email}</div>
            </>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden pb-4 px-2 -mx-2">
          <div className={`px-4 py-2 text-sm md:text-base text-gray-500 bg-red-100 font-semibold ${isSidebarCollapsed ? 'text-center' : 'px-6'}`}>
            {isSidebarCollapsed ? '≡' : 'DASHBOARD'}
          </div>
          {sections.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`w-full text-left py-3 md:py-2 hover:bg-gray-50 rounded transition flex items-center ${
                activeSection === key ? "font-bold text-black bg-gray-100" : "text-gray-800"
              } ${isSidebarCollapsed ? 'justify-center px-0' : 'px-6'}`}
              onClick={() => {
                setShowOrderDetail(false);
                setIsMobileMenuOpen(false);
                router.push(`/dashboard?section=${key}`);
              }}
              title={isSidebarCollapsed ? label : ''}
            >
              {isSidebarCollapsed ? (
                <span className="text-lg">{icon || label.charAt(0)}</span>
              ) : (
                <span className="truncate">{label}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 bg-[#fdf6ee] rounded-2xl min-h-[calc(100vh-1rem)] overflow-y-auto shadow-lg p-2 md:p-6 lg:p-8 transition-all duration-300 ${
        isSidebarCollapsed ? 'md:ml-24' : 'md:ml-0'
      } mt-10 md:mt-2`}>
        <SectionContent
          section={activeSection}
          orderId={orderId}
          onViewOrder={handleViewOrder}
          onBackHome={handleBackHome}
          showOrderDetail={showOrderDetail}
          selectedOrder={selectedOrder}
          orderChatMode={orderChatMode}
          onChatOrder={handleChatOrder}
          onReturnOrder={handleReturnOrder}
          onOrdersFetched={handleOrdersFetched}
          onBack={handleBackToOrders}
          returnOrder={returnOrder}
        />
      </main>
    </div>
  );
};

export default Dashboard;
