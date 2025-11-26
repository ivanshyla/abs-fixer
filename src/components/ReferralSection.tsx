"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";

export default function ReferralSection() {
    const [referralLink, setReferralLink] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Generate or retrieve unique User ID for referrals
        let userId = localStorage.getItem("abs_user_id");
        if (!userId) {
            userId = Math.random().toString(36).substring(2, 15);
            localStorage.setItem("abs_user_id", userId);
        }
        setReferralLink(`https://absai.app?ref=${userId}`);
    }, []);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                        Give 6, Get 6 🎁
                    </h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        Share your personal link. Your friends get <span className="font-semibold text-blue-600">6 extra credits</span> with their first purchase, and you get <span className="font-semibold text-blue-600">6 credits</span> too!
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
                        <div className="w-full relative">
                            <input
                                type="text"
                                readOnly
                                value={referralLink}
                                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className="w-full md:w-auto px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 min-w-[140px]"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5" />
                                    Copy Link
                                </>
                            )}
                        </button>
                    </div>
                    <p className="mt-4 text-sm text-gray-400">
                        Credits are automatically added when your friend makes a purchase.
                    </p>
                </div>
            </div>
        </section>
    );
}
