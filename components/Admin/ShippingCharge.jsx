"use client"
import React, { useState, useEffect } from 'react';
import ZipCode from './ZipCode'
import CreatePrice from './CreatePrice'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
const ShippingCharge = () => {
    const sectionConfig = [
    { key: 'zip', label: 'Zip Code', component: (props) => <ZipCode {...props} /> },
    { key: 'price', label: 'Price Management', component: (props) => <CreatePrice {...props} /> },
  ];
  const [activeSection, setActiveSection] = useState(sectionConfig[0].key);
  const [loading, setLoading] = useState(false);
  return (
        <div style={{ minHeight: '85vh', background: '#fff', padding: '20px' }}>
          {loading ? (
            <div className="text-center text-lg font-semibold">Loading product...</div>
          ) : (
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full h-full">
              <div className="flex h-full">
                {/* Sidebar Tabs */}
                <TabsList className="flex flex-col gap-2 min-w-[220px] w-[220px] bg-gray-300 border-r border-gray-200 py-4 px-2 rounded-l-lg shadow-sm h-fit">
                  {sectionConfig.map(section => (
                    <TabsTrigger
                      key={section.key}
                      value={section.key}
                      className={
                        `text-base px-6 py-3 text-left rounded-lg transition-all font-medium
                        data-[state=active]:bg-blue-600 data-[state=active]:text-white
                        data-[state=inactive]:bg-blue-100 data-[state=inactive]:text-gray-900
                        hover:bg-blue-400 focus:outline-none w-full`
                      }
                      style={{ justifyContent: 'flex-start' }}
                    >
                      {section.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {/* Section Content */}
                <div className="flex-1 p-4 rounded-r-lg shadow-sm min-h-[400px]">
                  {sectionConfig.map(section => (
                    <TabsContent key={section.key} value={section.key} className="h-full">
                      {section.component({ })}
                    </TabsContent>
                  ))}
                </div>
              </div>
            </Tabs>
          )}
        </div>
      );
}

export default ShippingCharge