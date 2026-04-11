import React from 'react';
import { Settings, Shield, Bell, Key } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">System Settings</h2>
        <p className="text-gray-500 mt-1">Configure monitoring preferences and alert thresholds.</p>
      </div>

      <div className="space-y-6">
        {/* Protection Core */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center bg-gray-50/50">
            <Shield className="text-blue-500 mr-3" size={20} />
            <h3 className="font-semibold text-gray-900">Monitoring Modules</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Keystroke & NLP Tracking</h4>
                <p className="text-sm text-gray-500">Capture and analyze typed sentences in real-time.</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="toggle1" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-blue-500 appearance-none cursor-pointer translate-x-6" />
                <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-6 rounded-full bg-blue-500 cursor-pointer"></label>
              </div>
            </div>
            <div className="border-t border-gray-100"></div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Web Phishing Blocker</h4>
                <p className="text-sm text-gray-500">Actively scan visited domains against threat databases.</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="toggle2" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-blue-500 appearance-none cursor-pointer translate-x-6" />
                <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-6 rounded-full bg-blue-500 cursor-pointer"></label>
              </div>
            </div>
            <div className="border-t border-gray-100"></div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Audio Interception</h4>
                <p className="text-sm text-gray-500">Record 30-sec snippets when critical incidents arise.</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="toggle3" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-blue-500 appearance-none cursor-pointer translate-x-6" />
                <label htmlFor="toggle3" className="toggle-label block overflow-hidden h-6 rounded-full bg-blue-500 cursor-pointer"></label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl shadow-md transition-all">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
