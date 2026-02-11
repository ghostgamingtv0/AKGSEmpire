import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Shield, Lock, Globe, ExternalLink } from 'lucide-react';

import { CONTRACT_ADDRESS } from '../constants';

const Tokenomics = () => {
  const data = [
    { name: 'Circulating Supply', value: 431.89, color: '#53FC18' },
    { name: 'Burned', value: 30.15, color: '#FF3B3B' },
    { name: 'Marketing & Dev', value: 20, color: '#FFFFFF' },
    { name: 'Liquidity Pool', value: 17.96, color: '#1A1A1A' },
  ];

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">TOKENOMICS</h2>
          <div className="h-1 w-24 bg-[#53FC18] mx-auto rounded-full"></div>
        </motion.div>

        {/* GeckoTerminal Widget Area */}
        <div className="glass-panel p-4 h-[600px] w-full overflow-hidden mb-20">
           <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#53FC18] animate-pulse"></span>
              <span className="font-bold">Live Chart</span>
              <img src="https://i.ibb.co/TD4bgczv/geckoterminal-icon.png" alt="GeckoTerminal" className="h-6 w-6 ml-2" />
            </div>
            <a href={`https://www.geckoterminal.com/polygon_pos/pools/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#53FC18] hover:underline flex items-center gap-1">
              <img src="https://i.ibb.co/B5FHyTcS/geckoterminal-dark.png" alt="GeckoTerminal" className="h-6 mr-2" />
              Open in GeckoTerminal <ExternalLink size={14} />
            </a>
          </div>
          <iframe 
            height="100%" 
            width="100%" 
            id="geckoterminal-embed" 
            title="GeckoTerminal Embed" 
            src={`https://www.geckoterminal.com/polygon_pos/pools/${CONTRACT_ADDRESS}?embed=1&info=0&swaps=0`}
            frameBorder="0" 
            allow="clipboard-write" 
            allowFullScreen
          ></iframe>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Chart Section */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-8 relative min-h-[400px] flex flex-col items-center justify-center border border-[#53FC18]/20 shadow-[0_0_30px_rgba(83,252,24,0.1)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#53FC18]/5 to-transparent rounded-3xl pointer-events-none" />
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', borderColor: '#333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-4 w-full mt-8">
              {data.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-200 text-lg font-medium">{item.name} ({item.value}M)</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stats Details */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="glass-panel p-8 border-l-4 border-l-[#53FC18]">
              <h3 className="text-2xl font-bold mb-2 text-white">Total Supply</h3>
              <p className="text-4xl font-mono text-[#53FC18]">500,000,000 AKGS</p>
              <p className="text-gray-300 text-lg mt-2">Fixed Supply, No Minting Function</p>
            </div>

            <div className="glass-panel p-8 border-l-4 border-l-red-500">
              <h3 className="text-2xl font-bold mb-2 text-white">Total Burned</h3>
              <p className="text-4xl font-mono text-red-500">30,148,797 AKGS</p>
              <p className="text-gray-300 text-lg mt-2">Permanently removed from circulation</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass-panel p-8 text-center">
                <div className="text-gray-300 text-xl mb-2">Buy Tax</div>
                <div className="text-4xl font-bold text-[#53FC18]">5%</div>
              </div>
              <div className="glass-panel p-8 text-center">
                <div className="text-gray-300 text-xl mb-2">Sell Tax</div>
                <div className="text-4xl font-bold text-[#53FC18]">5%</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Security Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { icon: <Shield size={40} />, title: "Contract Verified", desc: "Source code verified on PolygonScan" },
            { icon: <Lock size={40} />, title: "Liquidity Locked", desc: "12 Months lock duration" },
            { icon: <Globe size={40} />, title: "Anti-Whale", desc: "Max transaction limits active" }
          ].map((item, i) => (
            <div key={i} className="glass-panel p-8 text-center hover:bg-white/10 transition-all duration-300 group">
              <div className="inline-flex p-5 rounded-full bg-white/5 text-[#53FC18] mb-6 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-gray-300 text-lg">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tokenomics;
