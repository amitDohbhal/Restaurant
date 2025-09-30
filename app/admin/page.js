'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()

  // Redirect if not admin
  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/admin/login')
    }
  }, [session, router])

  const quickLinks = [
    // Room Management
    {
      name: 'Room Management',
      path: '/admin/room_info',
      category: 'Rooms & Guests',
      icon: '🏨',
      description: 'Manage room status and details'
    },
    {
      name: 'Guest Check-in',
      path: '/admin/add_guest_to_room',
      category: 'Rooms & Guests',
      icon: '👥',
      description: 'Check-in new guests to rooms'
    },
    {
      name: 'View Guests',
      path: '/admin/view_guest_staying_in_room',
      category: 'Rooms & Guests',
      icon: '👥',
      description: 'View guests currently staying'
    },
    {
      name: 'CheckOut Guest',
      path: '/admin/check_out_guest',
      category: 'Rooms & Guests',
      icon: '🚪',
      description: 'Process guest checkouts'
    },

    // Invoices & Payments
    {
      name: 'Create Room Invoice',
      path: '/admin/create_room_invoice',
      category: 'Invoices & Payments',
      icon: '🧾',
      description: 'Generate new room invoices'
    },
    {
      name: 'View Room Invoices',
      path: '/admin/room_invoice',
      category: 'Invoices & Payments',
      icon: '📋',
      description: 'View room invoices'
    },
    {
      name: 'Room Invoice Logs',
      path: '/admin/room_invoice_logs',
      category: 'Invoices & Payments',
      icon: '📜',
      description: 'View room invoice history'
    },
    {
      name: 'Payment Report',
      path: '/admin/payment_report',
      category: 'Invoices & Payments',
      icon: '📊',
      description: 'View payment reports and history'
    },
    {
      name: 'All Invoices',
      path: '/admin/all_invoice_overview',
      category: 'Invoices & Payments',
      icon: '📑',
      description: 'View all invoices'
    },
    {
      name: 'Create Discount',
      path: '/admin/create_discount',
      category: 'Invoices & Payments',
      icon: '🎫',
      description: 'Create and manage discounts'
    },

    // Restaurant & Food
    // Add this under the "Restaurant & Food" category, before the Stock Management section
    {
      name: 'Running Orders',
      path: '/admin/running_order',
      category: 'Restaurant',
      icon: '🔄',
      description: 'View and manage active food orders'
    },
    {
      name: 'Direct Food Order',
      path: '/admin/create_direct_food_order',
      category: 'Restaurant',
      icon: '🍽️',
      description: 'Create direct food orders'
    },
    {
      name: 'Restaurant Invoice',
      path: '/admin/create_restaurant_invoice',
      category: 'Restaurant',
      icon: '📝',
      description: 'Create restaurant invoices'
    },
    {
      name: 'Management Food Order',
      path: '/admin/management_food_order',
      category: 'Restaurant',
      icon: '👨‍🍳',
      description: 'Management food orders'
    },
    {
      name: 'Food Inventory',
      path: '/admin/create_food_inventory',
      category: 'Restaurant',
      icon: '📦',
      description: 'Manage food inventory'
    },
    {
      name: 'Food Inventory Logs',
      path: '/admin/food_inventory_log',
      category: 'Restaurant',
      icon: '📋',
      description: 'View food inventory history'
    },
    {
      name: 'Food Categories',
      path: '/admin/create_food_category',
      category: 'Restaurant',
      icon: '🏷️',
      description: 'Manage food categories'
    },

    // Stock Management
    {
      name: 'Stock Products',
      path: '/admin/stock_product_overview',
      category: 'Stock',
      icon: '📦',
      description: 'Manage stock products'
    },
    {
      name: 'Stock Categories',
      path: '/admin/create_stock_category',
      category: 'Stock',
      icon: '🏷️',
      description: 'Manage stock categories'
    },
    {
      name: 'Stock Inventory',
      path: '/admin/stock_final_overview',
      category: 'Stock',
      icon: '📊',
      description: 'View stock inventory'
    },
    {
      name: 'Vendors',
      path: '/admin/create_vendor',
      category: 'Stock',
      icon: '🏢',
      description: 'Manage vendors'
    },
    {
      name: 'Stock Products',
      path: '/admin/create_stock_product',
      category: 'Stock',
      icon: '📦',
      description: 'Create stock products'
    },
    {
      name: 'Stock Inventory',
      path: '/admin/create_stock_inventory',
      category: 'Stock',
      icon: '📊',
      description: 'Create stock inventory'
    },

    // Content Management
    {
      name: 'Banners',
      path: '/admin/change_banner_image',
      category: 'Content',
      icon: '🖼️',
      description: 'Manage website banners'
    },
    {
      name: 'PopUp Banners',
      path: '/admin/popup_banner',
      category: 'Content',
      icon: '📢',
      description: 'Manage popup banners'
    },
    {
      name: 'Promotional Banners',
      path: '/admin/promotional_banner',
      category: 'Content',
      icon: '🎉',
      description: 'Manage promotional banners'
    },
    {
      name: 'Featured Banners',
      path: '/admin/featured_offered_banner',
      category: 'Content',
      icon: '⭐',
      description: 'Manage featured banners'
    },
    {
      name: 'Featured Products',
      path: '/admin/manage_featured_packages',
      category: 'Content',
      icon: '✨',
      description: 'Manage featured products'
    },
    {
      name: 'Menu Sections',
      path: '/admin/manage_sub_menu',
      category: 'Content',
      icon: '📋',
      description: 'Manage menu sections'
    },
    {
      name: 'Basic Info',
      path: '/admin/upload_basic_info',
      category: 'Content',
      icon: 'ℹ️',
      description: 'Update basic information'
    },

    // Admin
    {
      name: 'Admin Users',
      path: '/admin/create_user',
      category: 'Admin',
      icon: '👤',
      description: 'Manage admin users'
    },
    {
      name: 'FAQs',
      path: '/admin/faq',
      category: 'Admin',
      icon: '❓',
      description: 'Manage frequently asked questions'
    }
  ];

  // Group links by category
  const linksByCategory = quickLinks.reduce((acc, link) => {
    if (!acc[link.category]) {
      acc[link.category] = [];
    }
    acc[link.category].push(link);
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome to the Hotel Management System</p>
      </div>

      {Object.entries(linksByCategory).map(([category, links]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">{category}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {links.map((link) => (
              <Card
                key={link.path}
                className="cursor-pointer hover:bg-gray-50 transition-colors h-full flex flex-col"
                onClick={() => router.push(link.path)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{link.icon}</span>
                    <CardTitle className="text-lg">{link.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1">
                  <p className="text-sm text-gray-600">{link.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

}
