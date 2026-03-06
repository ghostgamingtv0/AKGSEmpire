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
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 brand-gradient-text tracking-tighter">
            TOKENOMICS
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Strategic distribution and economic model of the AKGS Ecosystem. Built for long-term sustainability and community growth.
          </p>
        </motion.div>

        {/* Birdeye Chart Widget Area */}
        <div className="glass-panel p-1 rounded-[2rem] bg-gradient-to-br from-[#53FC18]/20 to-transparent mb-16 shadow-[0_0_50px_rgba(83,252,24,0.1)]">
          <div className="bg-[#050505] rounded-[1.9rem] p-6 h-[600px] w-full overflow-hidden relative">
            <div className="flex items-center justify-between mb-6 px-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#53FC18] animate-ping"></div>
                <span className="font-black text-white tracking-widest uppercase text-sm">Live Market Analysis</span>
              </div>
              <a href="https://birdeye.so/polygon/token/0xc291F63681Cd76383c3bDabE0B8E4bb072B4DF65/0xd3bfe6273c8a2aecff5d1fdea6827c70478ccb4a7e25259b5f0e3933af3c573f" target="_blank" rel="noopener noreferrer" className="bg-[#53FC18]/10 hover:bg-[#53FC18]/20 text-[#53FC18] px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 border border-[#53FC18]/30">
                BIRDEYE TERMINAL <ExternalLink size={14} />
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
              className="rounded-xl"
            ></iframe>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Chart Section */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-10 rounded-[2.5rem] relative overflow-hidden border border-white/5 bg-black/40 backdrop-blur-3xl shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#53FC18]/50 to-transparent"></div>
            <h3 className="text-2xl font-black text-white mb-10 text-center uppercase tracking-[0.2em]">Supply Distribution</h3>
            
            <div className="relative h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={130}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total</span>
                <span className="text-white text-2xl font-black">500M</span>
                <span className="text-[#53FC18] text-[10px] font-bold tracking-tighter">AKGS</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-12">
              {data.map((item) => (
                <div key={item.name} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="w-4 h-4 rounded-full mt-1 shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: item.color }}></div>
                  <div>
                    <p className="text-white font-bold text-xs uppercase tracking-wider">{item.name}</p>
                    <p className="text-[#53FC18] font-mono text-sm font-black">{item.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stats Details */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid gap-6"
          >
            <div className="glass-panel p-8 rounded-3xl flex items-center gap-8 border border-[#53FC18]/20 bg-gradient-to-br from-[#53FC18]/5 to-transparent group hover:border-[#53FC18]/40 transition-all">
              <div className="p-5 bg-[#53FC18]/10 rounded-2xl text-[#53FC18] group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(83,252,24,0.1)]">
                <Globe size={40} />
              </div>
              <div>
                <h3 className="text-gray-400 text-xs font-black uppercase tracking-[0.3em] mb-2">Total Supply</h3>
                <p className="text-4xl font-mono text-white font-black tracking-tighter">500,000,000</p>
                <p className="text-[#53FC18] text-xs mt-2 font-bold flex items-center gap-2">
                  <CheckCircle size={12} /> VERIFIED FIXED SUPPLY
                </p>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl flex items-center gap-8 border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent group hover:border-red-500/40 transition-all">
              <div className="p-5 bg-red-500/10 rounded-2xl text-red-500 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <Flame size={40} />
              </div>
              <div>
                <h3 className="text-gray-400 text-xs font-black uppercase tracking-[0.3em] mb-2">Deflationary Burn</h3>
                <p className="text-4xl font-mono text-white font-black tracking-tighter">30,148,797</p>
                <p className="text-red-500 text-xs mt-2 font-bold flex items-center gap-2">
                  <Zap size={12} /> PERMANENTLY REMOVED FROM CIRCULATION
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass-panel p-8 rounded-3xl text-center border border-white/10 bg-black/40 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#53FC18]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] mb-3">Buy Tax</div>
                  <div className="text-5xl font-black text-[#53FC18] drop-shadow-[0_0_15px_rgba(83,252,24,0.3)]">5%</div>
                </div>
              </div>
              <div className="glass-panel p-8 rounded-3xl text-center border border-white/10 bg-black/40 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#983695]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] mb-3">Sell Tax</div>
                  <div className="text-5xl font-black text-[#983695] drop-shadow-[0_0_15px_rgba(152,54,149,0.3)]">5%</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Security & Utility Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: <Shield size={32} />, title: "Contract Verified", desc: "Open-source verified on PolygonScan explorer.", color: "#53FC18" },
            { icon: <Lock size={32} />, title: "Liquidity Locked", desc: "12 Months initial lock period for investor safety.", color: "#983695" },
            { icon: <Zap size={32} />, title: "Ecosystem Utility", desc: "Used for rewards, staking, and governance access.", color: "#53FC18" }
          ].map((item, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -10 }}
              className="glass-panel p-10 rounded-[2rem] text-center border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-500"
            >
              <div className="inline-flex p-5 rounded-2xl bg-black/50 mb-8 shadow-inner" style={{ color: item.color }}>
                {item.icon}
              </div>
              <h3 className="text-xl font-black mb-4 text-white uppercase tracking-wider">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tokenomics;
