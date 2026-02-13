import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Share2, TrendingUp, ShieldCheck, Zap, Globe, Heart, Award, Target, Eye, ExternalLink, FileText } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { load } from '@fingerprintjs/fingerprintjs';

const Hero = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    if (code) {
      // Show Loading State (Optional UI enhancement could go here)
      const exchangeToken = async () => {
        try {
          console.log('Processing Kick Auth Code...');
          
          const codeVerifier = localStorage.getItem('kick_code_verifier');
          
          // Get Visitor ID (Stable)
          let visitorId = localStorage.getItem('stable_visitor_id');
          if (!visitorId) {
             const fpPromise = load();
             const result = await (await fpPromise).get();
             visitorId = result.visitorId;
             localStorage.setItem('stable_visitor_id', visitorId);
          }

          const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';
          const response = await fetch(`${API_BASE}/api/kick/exchange-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              code, 
              visitor_id: visitorId,
              code_verifier: codeVerifier,
              redirect_uri: window.location.origin + '/'
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Kick Auth Success', data);
            
            // Clear PKCE verifier
            localStorage.removeItem('kick_code_verifier');
            localStorage.removeItem('kick_auth_state');

            if (data.username) {
                localStorage.setItem('kickUsername', data.username);
                localStorage.setItem('isProfileSaved', 'true');
                if (data.profile_pic) localStorage.setItem('kickProfilePic', data.profile_pic);
            }
            
            // Force Redirect to Earn Page
            window.location.href = '/earn'; 
          } else {
            console.error('Kick Auth Failed');
            alert('Kick Connection Failed. Please try again.');
            window.location.href = '/earn';
          }
        } catch (error) {
          console.error('Kick Auth Error', error);
          window.location.href = '/earn';
        }
      };
      exchangeToken();
    }
  }, [location]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const features = [
    {
      icon: <Eye className="w-8 h-8 text-[#53FC18]" />,
      titleEn: "Meaningful Engagement",
      titleAr: "تفاعل ذو قيمة حقيقية",
      descEn: "Every second you spend watching and every interaction translates into tangible rewards.",
      descAr: "كل ثانية تقضيها في المشاهدة، وكل تفاعل (لايك، شير، تعليق)، يترجم فوراً إلى نقاط وعوائد مالية ملموسة."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-[#53FC18]" />,
      titleEn: "Fairness & Transparency",
      titleAr: "قمة العدالة والشفافية",
      descEn: "Algorithms ensuring fair distribution. Your share is proportional to your engagement.",
      descAr: "نعتمد خوارزميات دقيقة لضمان توزيع عادل للأرباح؛ حصتك من العوائد تعتمد كلياً على حجم تفاعلك الحقيقي."
    },
    {
      icon: <Award className="w-8 h-8 text-[#53FC18]" />,
      titleEn: "Eliminating Chance",
      titleAr: "وداعاً للحظ.. أهلاً بالجهد",
      descEn: "No random giveaways. A 'Proof of Engagement' model where effort determines reward.",
      descAr: "نظامنا لا يعتمد على الحظ أو التوزيع العشوائي؛ إنه نموذج 'إثبات التفاعل' حيث جهدك هو المعيار الوحيد للمكافأة."
    },
    {
      icon: <Target className="w-8 h-8 text-[#53FC18]" />,
      titleEn: "Our Goal",
      titleAr: "هدفنا الأسمى",
      descEn: "Building a sustainable ecosystem where creators and viewers both win.",
      descAr: "بناء مجتمع رقمي متكامل يربح فيه الجميع، وخلق بيئة مستدامة تحفظ حقوق صناع المحتوى والمشاهدين على حد سواء."
    }
  ];

  return (
    <div className="relative min-h-screen pt-20 pb-20 overflow-hidden bg-[#050505]">
      {/* Background Effects with Eyes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(83,252,24,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(83,252,24,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
        
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_30%,rgba(83,252,24,0.05),transparent_60%)] pointer-events-none"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-black/40 border border-[#53FC18]/30 backdrop-blur-md shadow-[0_0_20px_rgba(83,252,24,0.15)] group hover:border-[#53FC18]/60 transition-colors cursor-default">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#53FC18] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#53FC18]"></span>
              </span>
              <span className="text-sm font-bold text-gray-200 tracking-wide font-arabic group-hover:text-white transition-colors">مستقبل التفاعل الرقمي</span>
            </div>
          </motion.div>
          
          {/* Main Title */}
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-tight relative z-20 font-arabic" dir="rtl">
            <span className="block text-white mb-4 drop-shadow-2xl opacity-90 hover:opacity-100 transition-opacity">مستقبل التفاعل الرقمي..</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#53FC18] via-white to-[#53FC18] animate-gradient-x drop-shadow-[0_0_25px_rgba(83,252,24,0.4)] pb-4">
              حيث وقتك له ثمن في مجتمعنا
            </span>
          </motion.h1>

          <motion.h2 variants={itemVariants} className="text-xl md:text-2xl font-bold text-gray-400 mb-12 relative z-20 max-w-3xl mx-auto leading-relaxed">
            The Future of Digital Engagement.. <br className="hidden md:block" />
            <span className="text-[#53FC18] drop-shadow-[0_0_10px_rgba(83,252,24,0.3)]">Where Your Time is Your Asset</span>
          </motion.h2>
          
          {/* Stats/Vision Grid */}
          <motion.div variants={itemVariants} className="max-w-5xl mx-auto mb-16 relative z-20">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Stat Card */}
                <div className="glass-panel p-8 border border-[#53FC18]/20 bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors">
                  <div className="flex items-start gap-4">
                     <div className="p-3 bg-[#53FC18]/10 rounded-lg">
                        <TrendingUp className="text-[#53FC18]" size={32} />
                     </div>
                     <div>
                         <h4 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <span className="text-[#53FC18]">300%</span> Growth
                         </h4>
                         <p className="text-gray-300 text-base leading-relaxed">
                           Projected ecosystem growth through our unique Watch-to-Earn mechanism and strategic token burns.
                         </p>
                     </div>
                  </div>
                </div>

                {/* Vision Card */}
                <div className="glass-panel p-8 border border-white/10 bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors">
                  <div className="flex flex-col md:flex-row gap-6">
                     <div className="flex-1">
                         <h4 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <Globe size={24} /> The Vision
                         </h4>
                         <p className="text-gray-300 text-base leading-relaxed">
                           We are redefining the rules of the digital content industry. Instead of the viewer being just a statistic, we transform them into a true partner in success.
                         </p>
                     </div>
                     <div className="hidden md:block w-px h-auto bg-white/10"></div>
                     <div className="flex-1">
                        <p className="text-gray-300 text-base leading-relaxed">
                            Our project merges entertainment with real-world earnings through a profit-sharing system built entirely on meritocracy rather than luck.
                        </p>
                     </div>
                  </div>
                </div>
            </div>
          </motion.div>
          
          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12 relative z-20">
            <Link to="/earn" className="w-full sm:w-auto px-8 py-4 bg-[#53FC18] text-black text-lg font-bold rounded-xl hover:bg-[#45d415] transition-all hover:scale-105 shadow-[0_0_20px_rgba(83,252,24,0.3)] flex items-center justify-center gap-3 group relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <Zap className="relative z-10 group-hover:fill-black transition-colors" size={24} />
              <span className="relative z-10">Start Earning / ابدأ الربح</span>
            </Link>
            <motion.a 
              href="https://drive.google.com/file/d/1EZtQ-iv2Q9OIiO8SN8Ew9C9WX_4v_FH8/view?usp=sharing" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full sm:w-auto relative px-8 py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3 overflow-hidden group transition-all duration-300 border border-white/10 bg-white/5 hover:bg-[#53FC18]/10 hover:border-[#53FC18]/50 hover:shadow-[0_0_20px_rgba(83,252,24,0.15)]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <FileText className="text-gray-400 group-hover:text-[#53FC18] transition-colors duration-300" size={24} />
              <span className="text-gray-200 group-hover:text-white transition-colors duration-300">Whitepaper / الورقة البيضاء</span>
            </motion.a>
          </motion.div>

          {/* Investment Options */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 relative z-20">
             <a href="https://app.uniswap.org/explore/tokens/polygon/0xc291f63681cd76383c3bdabe0b8e4bb072b4df65" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-6 py-3 bg-[#FF007A]/10 border border-[#FF007A] rounded-xl text-[#FF007A] font-bold hover:bg-[#FF007A] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group">
                <img src="https://uniswap.org/favicon.ico" alt="" className="w-5 h-5 rounded-full opacity-80" onError={(e) => e.target.style.display = 'none'} />
                Buy on Uniswap
                <ExternalLink size={16} />
             </a>
          </motion.div>

          {/* Partners Section */}
          <motion.div variants={itemVariants} className="mb-20 relative z-20">
            <p className="text-gray-400 text-sm uppercase tracking-widest mb-8 font-bold text-center">Strategic Partners</p>
            <div className="flex justify-center items-center gap-8 flex-wrap">
              <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#53FC18] to-green-600 rounded-lg blur opacity-20 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <a href="https://www.geckoterminal.com/" target="_blank" rel="noopener noreferrer" className="relative flex flex-col items-center bg-black/50 border border-white/10 p-6 rounded-xl hover:border-[#53FC18]/50 transition-colors backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-[#53FC18]/10 border border-[#53FC18]/20">
                        <span className="w-2 h-2 rounded-full bg-[#53FC18] animate-pulse"></span>
                        <span className="text-[10px] uppercase font-bold text-[#53FC18] tracking-wider">Official Sponsor</span>
                    </div>
                    <img src="https://i.ibb.co/B5FHyTcS/geckoterminal-dark.png" alt="GeckoTerminal" className="h-10 md:h-12 opacity-90 group-hover:opacity-100 transition-opacity" />
                  </a>
              </div>
            </div>
          </motion.div>

          {/* How It Works Grid */}
          <motion.div variants={itemVariants}>
             <h3 className="text-3xl font-bold mb-10 text-center relative z-20">
               <span className="block text-[#53FC18] text-sm tracking-widest uppercase mb-2">How It Works</span>
               كيف يعمل النظام؟
             </h3>
             
             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-20">
               {features.map((feature, index) => (
                 <motion.div
                   key={index}
                   whileHover={{ y: -10 }}
                   className="glass-panel p-6 text-center hover:bg-[#53FC18]/5 transition-all duration-300 border border-white/5 hover:border-[#53FC18]/30 group backdrop-blur-md"
                 >
                   <div className="inline-flex p-4 rounded-2xl bg-[#53FC18]/10 text-[#53FC18] mb-6 group-hover:scale-110 group-hover:bg-[#53FC18] group-hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(83,252,24,0.1)]">
                     {React.cloneElement(feature.icon, { className: "w-8 h-8" })}
                   </div>
                   
                   <div className="space-y-4">
                     <div>
                       <h4 className="font-bold text-lg text-white mb-1">{feature.titleEn}</h4>
                       <p className="text-xs text-gray-500">{feature.descEn}</p>
                     </div>
                     <div className="h-px w-12 bg-white/10 mx-auto"></div>
                     <div dir="rtl">
                       <h4 className="font-bold text-lg text-[#53FC18] mb-1 font-arabic">{feature.titleAr}</h4>
                       <p className="text-xs text-gray-400 font-arabic">{feature.descAr}</p>
                     </div>
                   </div>
                 </motion.div>
               ))}
             </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            variants={itemVariants}
            className="mt-20 pt-10 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-20"
          >
            {[
              { label: 'Total Supply', value: '500M', icon: <Target size={16} /> },
              { label: 'Circulating', value: '431.89M', icon: <Zap size={16} /> },
              { label: 'Burned', value: '30M+', icon: <TrendingUp size={16} /> },
              { label: 'Holders', value: '12K+', icon: <Heart size={16} /> },
            ].map((stat, index) => (
              <div key={index} className="relative group cursor-default">
                <div className="absolute inset-0 bg-[#53FC18]/5 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 group-hover:border-[#53FC18]/30 transition-all duration-300 backdrop-blur-sm text-center">
                    <div className="text-4xl font-black text-white mb-2 group-hover:text-[#53FC18] transition-colors duration-300 drop-shadow-lg font-mono tracking-tighter">{stat.value}</div>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400 uppercase tracking-widest font-bold">
                        {stat.icon}
                        {stat.label}
                    </div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
