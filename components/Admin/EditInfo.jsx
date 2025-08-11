"use client";
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CreatePromotional from './CreatePromotional';
import ManageArtisanBlogs from './ManageArtisanBlogs';
import ArtisonStory from './ArtisonStory';
import SocialPlugins from './SocialPlugins';
import Certificate from './Certificate';
import ArtisanBanner from './ArtisanBanner';
import { ArrowLeftIcon } from 'lucide-react';
// import ProductCatalog from './ProductCatalog';

const sectionConfig = [
  {
    key: 'promotionalReviews',
    label: 'Promotional Reviews',
    component: CreatePromotional,
  },
  {
    key: 'artisanBlogs',
    label: 'Management Blogs',
    component: ManageArtisanBlogs,
  },
  {
    key: 'artisanStory',
    label: 'Management Story',
    component: ArtisonStory,
  },
  {
    key: 'social',
    label: 'Social Plugins',
    component: SocialPlugins,
  },
  {
    key: 'certifications',
    label: 'Certifications',
    component: Certificate,
  },
  {
    key: 'banner',
    label: 'Add Banner',
    component: ArtisanBanner,
  },
];

const EditInfo = () => {
  const params = useParams();
  const artisanId = params?.id;
  const [activeSection, setActiveSection] = useState(sectionConfig[0].key);
  const [artisanDetails, setArtisanDetails] = useState(null);
  const router = useRouter();

  React.useEffect(() => {
    // Try to get artisan from sessionStorage (set in EditArtisan)
    let artisan = null;
    try {
      const stored = sessionStorage.getItem(`artisan_${artisanId}`);
      if (stored) {
        artisan = JSON.parse(stored);
      }
    } catch { }
    if (artisan) {
      setArtisanDetails(artisan);
    } else if (artisanId) {
      // fallback: fetch from API
      fetch(`/api/createArtisan`).then(res => res.json()).then(data => {
        const found = data.find(a => a._id === artisanId);
        if (found) setArtisanDetails(found);
      });
    }
  }, [artisanId]);

  return (
    <div style={{ minHeight: '85vh', background: '#fff', padding: '20px' }}>
      {/* Show artisan details at the top if present */}
      <div className="back mb-2">
        <button className='px-4 py-1 bg-gray-500 text-white rounded flex items-center' onClick={() => router.back()}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to View Management
        </button>
      </div>
      {artisanDetails && (
        <div className="mb-4 p-4 bg-blue-50 rounded shadow flex gap-8 items-center">
          <div>
            <div className="font-bold text-lg">Management Name: {artisanDetails.title} {artisanDetails.firstName} {artisanDetails.lastName}</div>
            <div className="font-semibold text-md">Management Number: {artisanDetails.artisanNumber}</div>
          </div>
        </div>
      )}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full h-full">
        <div className="flex h-full">
          {/* Sidebar Tabs */}
          <TabsList className="flex flex-col gap-2 min-w-[220px] w-[220px] bg-gray-300 border-r border-gray-200 py-4 px-2 rounded-l-lg shadow-sm h-fit">
            {sectionConfig.map(section => (
              <TabsTrigger
                key={section.key}
                value={section.key}
                className={
                  `text-base px-3 py-3 text-left rounded-lg transition-all font-medium
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
                {typeof section.component === 'function' ? (
                  <section.component artisanId={artisanId} artisanDetails={artisanDetails} />
                ) : (
                  (typeof section.component === 'object' && !React.isValidElement(section.component))
                    ? <span style={{color:'red'}}>Invalid section.component: object cannot be rendered</span>
                    : section.component
                )}
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default EditInfo;