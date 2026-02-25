import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Shield, Lock, Globe, ExternalLink, Flame } from 'lucide-react';

import { CONTRACT_ADDRESS } from '../../../constants';

const Tokenomics = () => {
  const data = [
    { name: 'Circulating Supply', value: 431.89, color: '#53FC18', abs: '431,891,203 AKGS' },
    { name: 'Burned', value: 30.15, color: '#FF3B3B', abs: '30,148,797 AKGS' },
    { name: 'Marketing & Dev', value: 20.00, color: '#FFFFFF', abs: '20,000,000 AKGS' },
    { name: 'Liquidity Pool', value: 17.96, color: '#1A1A1A', abs: '17,960,000 AKGS' },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#050505] border border-[#333] p-3 rounded-lg shadow-xl">
          <p className="text-white font-bold mb-1">{payload[0].name}</p>
          <p className="text-[#53FC18] font-mono text-sm">{payload[0].payload.abs}</p>
          <p className="text-gray-400 text-xs mt-1">{payload[0].value}% of Total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden empire-gradient-page">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 brand-gradient-text">
            TOKENOMICS
          </h2>
          <div className="h-1 w-24 bg-[#53FC18] mx-auto rounded-full"></div>
        </motion.div>

        {/* Birdeye Chart Widget Area */}
        <div className="glass-panel p-4 h-[600px] w-full overflow-hidden mb-12">
           <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#53FC18] animate-pulse"></span>
              <span className="font-bold">Live Chart (Birdeye)</span>
              <img src="https://birdeye.so/favicon.ico" alt="Birdeye" className="h-4 w-4 ml-2" />
            </div>
            <a href="https://birdeye.so/polygon/token/0xc291F63681Cd76383c3bDabE0B8E4bb072B4DF65/0xd3bfe6273c8a2aecff5d1fdea6827c70478ccb4a7e25259b5f0e3933af3c573f" target="_blank" rel="noopener noreferrer" className="text-sm text-[#53FC18] hover:underline flex items-center gap-1">
              Open in Birdeye <ExternalLink size={14} />
            </a>
          </div>
          <iframe 
            height="100%" 
            width="100%" 
            id="birdeye-embed" 
            title="Birdeye Chart" 
            src="https://birdeye.so/tv-widget/0xc291F63681Cd76383c3bDabE0B8E4bb072B4DF65?chain=polygon&viewMode=pair&pairAddress=0xd3bfe6273c8a2aecff5d1fdea6827c70478ccb4a7e25259b5f0e3933af3c573f"
            frameBorder="0" 
            allow="clipboard-write" 
            allowFullScreen
          ></iframe>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
          {/* Chart Section */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-8 relative min-h-[400px] flex flex-col items-center justify-center"
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
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-4 w-full mt-8">
              {data.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-300 text-sm font-medium">{item.name} ({item.value}%)</span>
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
            <div className="glass-panel p-8 flex items-center gap-6">
              <div className="p-4 bg-[#53FC18]/10 rounded-full text-[#53FC18]">
                <Globe size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1 text-white">Total Supply</h3>
                <p className="text-3xl font-mono text-[#53FC18] font-bold">500,000,000</p>
                <p className="text-gray-400 text-sm mt-1">Fixed Supply</p>
              </div>
            </div>

            <div className="glass-panel p-8 flex items-center gap-6">
              <div className="p-4 bg-red-500/10 rounded-full text-red-500">
                <Flame size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1 text-white">Total Burned</h3>
                <p className="text-3xl font-mono text-red-500 font-bold">30,148,797</p>
                <p className="text-gray-400 text-sm mt-1">Permanently removed</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass-panel p-6 text-center">
                <div className="text-gray-400 text-lg mb-2">Buy Tax</div>
                <div className="text-4xl font-black text-[#53FC18]">5%</div>
              </div>
              <div className="glass-panel p-6 text-center">
                <div className="text-gray-400 text-lg mb-2">Sell Tax</div>
                <div className="text-4xl font-black text-[#53FC18]">5%</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Security Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: <Shield size={32} />, title: "Contract Verified", desc: "Source code verified on PolygonScan" },
            { icon: <Lock size={32} />, title: "Liquidity Locked", desc: "12 Months lock duration" },
            { icon: <Globe size={32} />, title: "Anti-Whale", desc: "Max transaction limits active" }
          ].map((item, i) => (
            <div key={i} className="glass-panel p-8 text-center hover:bg-white/5 transition-all duration-300 group">
              <div className="inline-flex p-4 rounded-2xl bg-[#983695]/10 text-[#983695] mb-6 group-hover:scale-110 group-hover:bg-[#983695] group-hover:text-black transition-all duration-300 shadow-[0_0_25px_rgba(152,54,149,0.3)]">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 brand-gradient-text">{item.title}</h3>
              <p className="text-sm brand-gradient-text">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tokenomics;
