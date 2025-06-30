"use client"

import { useState } from 'react'
import { VideoDownloader } from '@/components/video-downloader'
import { Toaster } from '@/components/ui/sonner'

export default function Home() {
  const [activeTool, setActiveTool] = useState('downloader')
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'downloader':
        return <VideoDownloader />
      default:
        return <VideoDownloader />
    }
  }

  return (
    <div className="relative h-screen w-screen">
      {/* Main content always centered in viewport */}
      <div className="fixed inset-0 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {renderActiveTool()}
        </div>
        {/* Footer */}
        <footer className="mt-16 mb-4 text-xs text-gray-400 text-center">
          by continuing, you agree to{' '}
          <button className="underline hover:text-gray-600" onClick={() => setShowTerms(true)} type="button">
            terms & conditions
          </button>
          {' '}and{' '}
          <button className="underline hover:text-gray-600" onClick={() => setShowPrivacy(true)} type="button">
            privacy notice
          </button>
        </footer>
      </div>

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Privacy Notice</h2>
            <div className="space-y-4 text-sm">
              <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
              
              <p><strong>Information We Collect:</strong></p>
              <p>We do not collect, store, or process any personal information. Our service operates entirely on your device and through your browser.</p>
              
              <p><strong>No Data Collection:</strong></p>
              <p>• We do not use cookies or tracking technologies<br/>
              • We do not log your downloads or search queries<br/>
              • We do not store any video URLs or content<br/>
              • We do not require registration or personal information</p>
              
              <p><strong>Third-Party Services:</strong></p>
              <p>Our service may interact with YouTube, TikTok, and other platforms to fetch video information. Please review their respective privacy policies.</p>
              
              <p><strong>Contact:</strong></p>
              <p>If you have questions about this privacy notice, please contact us through our website.</p>
            </div>
            <button 
              onClick={() => setShowPrivacy(false)}
              className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Terms & Conditions</h2>
            <div className="space-y-4 text-sm">
              <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
              
              <p><strong>Acceptance of Terms:</strong></p>
              <p>By using this service, you agree to these terms and conditions.</p>
              
              <p><strong>Service Description:</strong></p>
              <p>This service allows you to download videos from supported platforms for personal use only.</p>
              
              <p><strong>User Responsibilities:</strong></p>
              <p>• You are responsible for ensuring you have the right to download content<br/>
              • You must comply with all applicable laws and platform terms of service<br/>
              • You may only download content for personal, non-commercial use<br/>
              • You must respect copyright and intellectual property rights</p>
              
              <p><strong>Prohibited Uses:</strong></p>
              <p>• Commercial use without permission<br/>
              • Distribution of copyrighted content<br/>
              • Any illegal activities<br/>
              • Circumventing platform restrictions</p>
              
              <p><strong>Disclaimer:</strong></p>
              <p>This service is provided "as is" without warranties. We are not affiliated with YouTube, TikTok, or any other platform.</p>
              
              <p><strong>Limitation of Liability:</strong></p>
              <p>We are not liable for any damages arising from the use of this service.</p>
              
              <p><strong>Changes:</strong></p>
              <p>We may update these terms at any time. Continued use constitutes acceptance of changes.</p>
            </div>
            <button 
              onClick={() => setShowTerms(false)}
              className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  )
} 