"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { ShieldCheck, TrendingUp, Cpu, Bell, Database, Zap, Lock, AlertTriangle, Blocks, Search, Loader2, Wallet } from 'lucide-react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

// --- Header Component ---
interface HeaderProps {
  setPage: (page: string) => void;
  activePage: string;
}

const Header: React.FC<HeaderProps> = ({ setPage, activePage }) => {
  const navItems = [
    { name: 'Home', page: 'home' },
    // { name: 'Analytics', page: 'analytics' }, // Commented out for now
    // { name: 'AI Signals', page: 'signals' }, // Commented out for now
    { name: 'Rug Pull Detector', page: 'security' }, // Renamed for clarity
  ];

  const getLinkClass = (page: string) => {
    return `cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      activePage === page
        ? 'bg-indigo-700 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm shadow-lg sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0">
            <span
              onClick={() => setPage('home')}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <TrendingUp className="h-8 w-8 text-indigo-400" />
              <span className="text-2xl font-bold text-white">ProphetFi</span>
            </span>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  onClick={() => setPage(item.page)}
                  className={getLinkClass(item.page)}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
          {/* Wallet Button added to the header */}
          <div className="flex items-center">
             <WalletMultiButton style={{ height: '40px', backgroundColor: '#4f46e5', borderRadius: '6px' }}/>
            {/* You might want a Launch App button as well, conditionally shown */}
            {/* <button className="ml-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all">
              Launch App
            </button> */}
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- Hero Section (Home Page) ---
const HeroSection: React.FC = () => (
    <div className="relative isolate overflow-hidden bg-gray-900 pt-16 pb-24 sm:pt-24 sm:pb-32">
      {/* Background Gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#8085ff] to-[#3B0764] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            The Future of DeFi Intelligence
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            ProphetFi leverages next-generation AI to provide predictive market insights, real-time risk assessment, and institutional-grade security for users and protocols.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button className="rounded-md bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all">
              Get Started
            </button>
            <a href="#features" className="text-base font-semibold leading-6 text-white hover:text-gray-200">
              Learn More <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );

// --- Features Section (Home Page) ---
const FeaturesSection: React.FC = () => {
    const features = [
      { name: 'Predictive Analytics', description: 'Our AI models analyze terabytes of data to forecast market trends.', icon: TrendingUp },
      { name: 'Real-Time AI Signals', description: 'Receive actionable AI-generated signals tailored to your risk profile.', icon: Bell },
      { name: 'Total Protocol Security', description: 'Protect users and treasury with real-time threat detection.', icon: ShieldCheck },
      { name: 'Deep On-Chain Data', description: 'Access deep wallet tracking, liquidity analysis, and auditing.', icon: Database },
      { name: 'AI-Powered Smart Contracts', description: 'Deploy adaptive contracts reacting to market conditions.', icon: Cpu },
      { name: 'Instant Risk Detection', description: 'Instantly score tokens/protocols for rug pull and exploit risks.', icon: Zap },
    ];

    return (
      <div id="features" className="bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <p className="text-base font-semibold leading-7 text-indigo-400">Why ProphetFi?</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              An Unfair Advantage in DeFi
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Navigate decentralized finance with confidence using our critical intelligence platform.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col p-6 rounded-lg bg-gray-800/50 shadow-lg transition-all hover:scale-105 hover:bg-gray-800">
                  <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-white">
                    <feature.icon className="h-6 w-6 flex-none text-indigo-400" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    );
  };

// --- Home Page Component ---
const HomePage: React.FC = () => (
    <>
      <HeroSection />
      <FeaturesSection />
    </>
  );

// --- Rug Pull Detection Page Component ---
interface RugPullResult {
    riskScore: number; // 0-100
    warnings: string[];
    isRugPull: boolean;
}

const RugPullDetectionPage: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [addressToCheck, setAddressToCheck] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<RugPullResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [feePaid, setFeePaid] = useState<boolean>(false); // Track if fee is paid for the current check

    const feeAmountSOL = 0.01; // Example fee in SOL
    const feeReceiverAddress = 'YOUR_FEE_RECEIVER_SOLANA_ADDRESS'; // Replace with your actual address

    const handleCheckAddress = useCallback(async () => {
        if (!publicKey) {
            setError("Please connect your wallet first.");
            return;
        }
        if (!addressToCheck.trim()) {
            setError("Please enter a Solana address to check.");
            return;
        }

        // Validate Solana Address (basic check)
        try {
            new PublicKey(addressToCheck.trim());
        } catch (err) {
            setError("Invalid Solana address format.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);
        setFeePaid(false); // Reset fee status for new check

        try {
            // --- Simulate Fee Transaction ---
            console.log("Simulating fee payment...");
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(feeReceiverAddress), // Use the actual receiver address
                    lamports: feeAmountSOL * LAMPORTS_PER_SOL,
                })
            );

            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight }
            } = await connection.getLatestBlockhashAndContext();


            const signature = await sendTransaction(transaction, connection, { minContextSlot });
            await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });

            console.log(`Fee payment transaction successful with signature: ${signature}`);
            setFeePaid(true); // Mark fee as paid

            // --- Simulate Rug Pull Check API Call ---
            console.log(`Checking address: ${addressToCheck.trim()}`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

            // --- Mock Result ---
            // Replace this with your actual API call and result handling
            const mockRisk = Math.random(); // Simulate risk
            const mockResult: RugPullResult = {
                riskScore: Math.floor(mockRisk * 100),
                isRugPull: mockRisk > 0.7, // Example threshold
                warnings: [],
            };

            if (mockRisk > 0.8) {
                mockResult.warnings.push("High concentration of tokens in top wallets.");
                mockResult.warnings.push("Liquidity pool unlocked or controlled by deployer.");
            } else if (mockRisk > 0.5) {
                mockResult.warnings.push("Moderate token concentration.");
                mockResult.warnings.push("No significant recent developer activity.");
            } else {
                 mockResult.warnings.push("Low token concentration.");
                 mockResult.warnings.push("Liquidity appears locked.");
            }

            setResult(mockResult);

        } catch (err: any) {
            console.error("Rug pull check failed:", err);
            // Handle specific transaction errors if needed
             if (err.message.includes('User rejected the request')) {
                setError("Transaction rejected. Please approve the fee payment to proceed.");
            } else if (err.message.includes('blockhash') || err.message.includes('timeout')) {
                setError("Transaction timed out or failed to confirm. Please try again.");
            }
             else {
                setError(`An error occurred: ${err.message || 'Unknown error'}`);
            }
            setFeePaid(false); // Reset fee status on error
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, addressToCheck, connection, sendTransaction]);

    const getRiskColor = (score: number) => {
        if (score > 70) return 'text-red-500';
        if (score > 40) return 'text-yellow-500';
        return 'text-green-500';
    };

    return (
      <div className="bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-16">
            <p className="text-base font-semibold leading-7 text-indigo-400">AI-Powered Security</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Solana Rug Pull Detector
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Connect your wallet, enter a Solana token or contract address, and pay a small fee ({feeAmountSOL} SOL) to get an AI-powered risk assessment.
            </p>
          </div>

          {/* Interaction Area */}
          <div className="bg-gray-800/50 p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
            {/* Wallet Connection Status */}
             <div className="mb-6 flex flex-col items-center">
                {!publicKey ? (
                     <>
                        <p className="text-center text-gray-400 mb-4">Connect your wallet to begin.</p>
                        <WalletMultiButton style={{ backgroundColor: '#4f46e5', borderRadius: '6px' }}/>
                     </>

                ) : (
                    <div className="text-center text-green-400 flex items-center">
                        <Wallet className="w-5 h-5 mr-2"/> Connected: {publicKey.toBase58().substring(0, 6)}...{publicKey.toBase58().substring(publicKey.toBase58().length - 4)}
                    </div>
                )}
            </div>

            {/* Address Input and Check Button */}
            {publicKey && (
                <div className="space-y-6">
                    <div>
                        <label htmlFor="solana-address" className="block text-sm font-medium leading-6 text-gray-300 mb-2">
                           Solana Address (Token or Contract)
                        </label>
                        <div className="relative">
                           <input
                              type="text"
                              name="solana-address"
                              id="solana-address"
                              value={addressToCheck}
                              onChange={(e) => setAddressToCheck(e.target.value)}
                              className="block w-full rounded-md border-0 bg-white/5 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 placeholder:text-gray-500"
                              placeholder="Enter address..."
                              disabled={isLoading}
                           />
                        </div>
                    </div>

                    <button
                        onClick={handleCheckAddress}
                        disabled={isLoading || !publicKey || !addressToCheck.trim()}
                        className="w-full flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {feePaid ? 'Analyzing...' : 'Processing Fee...'}
                            </>
                        ) : (
                           <> <Search className="mr-2 h-4 w-4" /> Check Address ({feeAmountSOL} SOL)</>

                        )}
                    </button>
                </div>
            )}

            {/* Results Area */}
            {error && (
                <div className="mt-6 rounded-md bg-red-900/50 p-4 text-center text-red-300 border border-red-700">
                    <AlertTriangle className="inline-block w-5 h-5 mr-2" /> {error}
                </div>
            )}

            {isLoading && !result && (
                 <div className="mt-6 text-center text-gray-400">
                    <p>{feePaid ? 'Running AI analysis...' : 'Waiting for fee confirmation...'}</p>
                 </div>
            )}


            {result && !isLoading && (
              <div className="mt-8 p-6 bg-gray-700/30 rounded-lg border border-gray-600">
                <h3 className="text-xl font-semibold text-white mb-4 text-center">Analysis Result</h3>
                <div className="text-center mb-4">
                  <span className={`text-5xl font-bold ${getRiskColor(result.riskScore)}`}>
                    {result.riskScore}
                  </span>
                  <span className="text-gray-400"> / 100 Risk Score</span>
                </div>
                 <div className={`text-center font-semibold mb-6 ${result.isRugPull ? 'text-red-400' : 'text-green-400'}`}>
                    {result.isRugPull ? 'High Risk / Potential Rug Pull Detected' : 'Lower Risk Detected'}
                 </div>
                {result.warnings.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-indigo-300 mb-2">Warnings & Observations:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {result.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                 <p className="text-xs text-gray-500 mt-6 text-center">Disclaimer: This is an automated analysis and not financial advice. DYOR.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
};


// --- Footer Component ---
const Footer: React.FC = () => (
    <footer className="bg-gray-900 border-t border-gray-700/50 mt-16 sm:mt-32">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 lg:px-8">
        {/* Footer Navigation (Optional) */}
        {/* <nav className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12" aria-label="Footer"> ... </nav> */}
        <p className="mt-10 text-center text-xs leading-5 text-gray-500">
          &copy; {new Date().getFullYear()} ProphetFi, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );

// --- Main App Component ---
export default function App() {
  const [page, setPage] = useState<string>('home'); // 'home' or 'security'

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans antialiased">
      <Header setPage={setPage} activePage={page} />
      <main>
        {page === 'home' && <HomePage />}
        {page === 'security' && <RugPullDetectionPage />}
        {/* Add other page components here as needed */}
      </main>
      <Footer />
    </div>
  );
}
