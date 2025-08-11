"use client"

import { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown } from 'lucide-react'

const languages = [
    { code: 'en', name: 'English', flag: '/flags/in.png' },
    { code: 'hi', name: 'Hindi', flag: '/flags/in.png' },
]


const LanguageSelector = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState(languages[0])
    const dropdownRef = useRef(null)

    // Initialize Google Translate
    useEffect(() => {
        const addScript = () => {
            const script = document.createElement('script')
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
            script.async = true
            document.body.appendChild(script)

            // @ts-ignore
            window.googleTranslateElementInit = () => {
                // @ts-ignore
                new window.google.translate.TranslateElement({
                    pageLanguage: 'en',
                    autoDisplay: false,
                    includedLanguages: languages.map(lang => lang.code).join(','),
                }, 'google_translate_element')
            }
        }

        // Add hidden div for Google Translate
        if (!document.getElementById('google_translate_element')) {
            const div = document.createElement('div')
            div.id = 'google_translate_element'
            div.style.display = 'none'
            document.body.appendChild(div)
            addScript()
        }

        // ✅ Hide the Google Translate top bar
        const style = document.createElement('style');
        style.innerHTML = `
  iframe.skiptranslate { display: none !important; }
  body { top: 0px !important; }
  .goog-te-banner-frame, .goog-te-balloon-frame, #goog-gt-tt { display: none !important; }
  .goog-te-gadget { display: none !important; }
  .goog-te-spinner-pos { display: none !important; }
  .goog-te-spinner-frame { display: none !important; } /* ✅ Hide spinner frame */
  .goog-te-spinner { display: none !important; } /* ✅ Hide spinner */
  .goog-tooltip, .goog-tooltip:hover { display: none !important; }
  .goog-tooltip-content { display: none !important; }
`;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, [])

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    // Change language function
    const changeLanguage = (language) => {
        setSelectedLanguage(language)
        setIsOpen(false)

        const selectElement = document.querySelector('.goog-te-combo')
        if (selectElement) {
            selectElement.value = language.code
            selectElement.dispatchEvent(new Event('change', { bubbles: true }))
        }
    }


    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 rounded-lg"
            >
                <Globe size={22} />
                {/* <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} /> */}
            </button>

            {isOpen && (
                <div className="absolute top-12 right-0 mt-1 w-48 text-black bg-white shadow-lg rounded-lg border z-50">
                    <div className="py-1">
                        {languages.map((language) => (
                            <button
                                key={language.code}
                                onClick={() => changeLanguage(language)}
                                className={`flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-blue-50 ${selectedLanguage.code === language.code ? 'bg-blue-50 font-medium' : ''
                                    }`}
                            >
                                <span>{language.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default LanguageSelector
