import { Timer, Rocket, Sparkles, Send, Twitter, Instagram, CheckCircle2, ShieldCheck, TrendingUp, MonitorCheck, Loader2, Zap, Tv, HeartHandshake } from 'lucide-react';
import { SOCIAL_LINKS } from '../config/constants';
import { useState, useEffect } from 'react';

const AKGsannance = () => {
  const calculateTimeLeft = () => {
    // Target Date: February 23, 2026
    const targetDate = new Date('2026-02-23T00:00:00');
    const now = new Date();
    const difference = targetDate - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return null; // Time's up
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const intervals = [
    { labelAr: 'أيام', labelEn: 'Days', value: timeLeft?.days || 0 },
    { labelAr: 'ساعات', labelEn: 'Hours', value: timeLeft?.hours || 0 },
    { labelAr: 'دقائق', labelEn: 'Minutes', value: timeLeft?.minutes || 0 },
    { labelAr: 'ثواني', labelEn: 'Seconds', value: timeLeft?.seconds || 0 }
  ];

  const TimeBox = ({ value, label, labelAr }) => (
    <div className="flex flex-col items-center group">
        <div className="w-full aspect-square bg-white/5 backdrop-blur-md border border-[#53FC18]/20 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group-hover:border-[#53FC18]/50 transition-all duration-300 shadow-lg shadow-black/50">
            <div className="absolute inset-0 bg-gradient-to-b from-[#53FC18]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-3xl md:text-6xl font-mono font-bold text-white relative z-10 mb-1">
                {String(value).padStart(2, '0')}
            </span>
            <div className="flex flex-col items-center gap-0.5 relative z-10">
                <span className="text-[10px] md:text-sm text-[#53FC18] font-bold uppercase tracking-wider">{label}</span>
                <span className="text-[10px] md:text-sm text-gray-400 font-medium">{labelAr}</span>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans text-white p-4">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(83,252,24,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(83,252,24,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#53FC18] rounded-full blur-[150px] opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl w-full text-center flex flex-col items-center pt-10 pb-10">
        {/* Logo */}
        <div className="mb-8">
           <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-[#53FC18] shadow-[0_0_50px_rgba(83,252,24,0.3)] overflow-hidden p-1 bg-black">
             <img 
               src="https://i.ibb.co/Jjdm6v0J/fe58cfb14a674ec977bf157cdc091cfd.jpg" 
               alt="AKGS Empire Logo" 
               className="w-full h-full object-cover rounded-full"
             />
           </div>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-7xl font-black mb-2 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-[#53FC18] to-white uppercase tracking-tighter font-heading">
          AKGS EMPIRE
        </h1>
        
        {/* Subtitle / Theme Badges */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-6">
            <span className="px-3 py-1 rounded border border-[#53FC18]/30 bg-[#53FC18]/5 text-[#53FC18] text-[10px] md:text-xs font-bold tracking-widest uppercase">Web3 Gaming</span>
            <span className="px-3 py-1 rounded border border-[#53FC18]/30 bg-[#53FC18]/5 text-[#53FC18] text-[10px] md:text-xs font-bold tracking-widest uppercase">Metaverse</span>
            <span className="px-3 py-1 rounded border border-[#53FC18]/30 bg-[#53FC18]/5 text-[#53FC18] text-[10px] md:text-xs font-bold tracking-widest uppercase">Social2Earn</span>
        </div>
        
        <div className="flex flex-col gap-2 mb-8">
          <p className="text-xl md:text-3xl text-white font-bold tracking-wide" dir="rtl">
            مستقبل التفاعل الرقمي.. حيث وقتك له ثمن
          </p>
          <p className="text-sm md:text-lg text-gray-300 font-medium tracking-widest uppercase">
            The Future of Digital Interaction.. Where Your Time Has Value
          </p>
        </div>

        {/* Social Links */}
        <div className="flex flex-col items-center gap-4 mb-10">
            <p className="text-gray-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                For Investment or Inquiries Contact <span className="text-[#53FC18]">//</span> للاستثمار او مزيد من معلومات مرجوا مراسلة على
            </p>
            <div className="flex items-center gap-6">
                <a href={SOCIAL_LINKS.KICK} target="_blank" rel="noreferrer" className="group">
                   <div className="w-12 h-12 rounded-xl bg-black border border-[#53FC18]/50 flex items-center justify-center group-hover:bg-[#53FC18] group-hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(83,252,24,0.2)] group-hover:shadow-[0_0_25px_rgba(83,252,24,0.6)]">
                       <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#53FC18] group-hover:fill-black transition-colors"><path fillRule="evenodd" clipRule="evenodd" d="M3 0h18a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3zm5.7 6.6h2.7v3.6l3.3-3.6h3.6l-4.2 4.5 4.5 6.3h-3.6l-3-4.2v4.2H8.7V6.6z"/></svg>
                   </div>
                </a>
                <a href={SOCIAL_LINKS.INSTAGRAM} target="_blank" rel="noreferrer" className="group">
                   <div className="w-12 h-12 rounded-xl bg-black border border-[#53FC18]/50 flex items-center justify-center group-hover:bg-[#53FC18] group-hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(83,252,24,0.2)] group-hover:shadow-[0_0_25px_rgba(83,252,24,0.6)]">
                       <Instagram className="w-6 h-6 text-[#53FC18] group-hover:text-black transition-colors" />
                   </div>
                </a>
            </div>
        </div>

        {/* Countdown Timer */}
        <div className="grid grid-cols-4 gap-3 md:gap-6 mb-16 w-full max-w-3xl">
            <TimeBox value={timeLeft.days} label="Days" labelAr="يوم" />
            <TimeBox value={timeLeft.hours} label="Hours" labelAr="ساعة" />
            <TimeBox value={timeLeft.minutes} label="Minutes" labelAr="دقيقة" />
            <TimeBox value={timeLeft.seconds} label="Seconds" labelAr="ثانية" />
        </div>

        {/* Main Content Grid: Roadmap & Winning Formula */}
        <div className="w-full grid md:grid-cols-2 gap-8 md:gap-16 px-4 mb-16 text-left">
            
            {/* Left Column: Roadmap */}
            <div>
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-[1px] w-12 bg-[#53FC18]"></div>
                    <h3 className="text-[#53FC18] font-bold text-sm tracking-[0.2em] uppercase font-heading">Development Roadmap</h3>
                </div>

                <div className="space-y-0 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[#53FC18]/20 z-0"></div>

                    {/* Stage 1 */}
                    <div className="relative z-10 flex gap-6 pb-8">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)]">
                            <CheckCircle2 size={20} className="text-[#53FC18]" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-heading tracking-wide">
                                Strategic Feasibility Study
                                <span className="text-[#53FC18] text-[10px] px-1.5 py-0.5 rounded bg-[#53FC18]/10 border border-[#53FC18]/30 font-sans font-bold">DONE</span>
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 font-medium">Expert-led market analysis & strategic planning.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">دراسة جدوى شاملة وتحليل استراتيجي.</p>
                        </div>
                    </div>

                    {/* Stage 2 */}
                    <div className="relative z-10 flex gap-6 pb-8">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)]">
                            <ShieldCheck size={20} className="text-[#53FC18]" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-heading tracking-wide">
                                Legal & IP Protection
                                <span className="text-[#53FC18] text-[10px] px-1.5 py-0.5 rounded bg-[#53FC18]/10 border border-[#53FC18]/30 font-sans font-bold">DONE</span>
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 font-medium">Official documentation & IP registration.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">توثيق قانوني وحماية الملكية الفكرية.</p>
                        </div>
                    </div>

                    {/* Stage 3 */}
                    <div className="relative z-10 flex gap-6 pb-8">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)]">
                            <MonitorCheck size={20} className="text-[#53FC18]" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-heading tracking-wide">
                                Infrastructure Setup
                                <span className="text-[#53FC18] text-[10px] px-1.5 py-0.5 rounded bg-[#53FC18]/10 border border-[#53FC18]/30 font-sans font-bold">DONE</span>
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 font-medium">Core system architecture & environment prep.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">تأسيس البنية التحتية للمشروع.</p>
                        </div>
                    </div>

                    {/* Stage 4 */}
                    <div className="relative z-10 flex gap-6 pb-8">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)]">
                            <TrendingUp size={20} className="text-[#53FC18]" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-heading tracking-wide">
                                Development & Polish
                                <span className="text-[#53FC18] text-[10px] px-1.5 py-0.5 rounded bg-[#53FC18]/10 border border-[#53FC18]/30 font-sans font-bold">DONE</span>
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 font-medium">Advanced coding & final system optimization.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">التطوير والتحسينات النهائية.</p>
                        </div>
                    </div>

                    {/* Stage 5 */}
                    <div className="relative z-10 flex gap-6">
                        <div className="w-10 h-10 rounded-full bg-[#53FC18] border border-[#53FC18] flex items-center justify-center shrink-0 animate-pulse shadow-[0_0_15px_rgba(83,252,24,0.6)]">
                            <Loader2 size={20} className="text-black animate-spin" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-heading tracking-wide">
                                Final Pre-Launch Phase
                                <span className="text-black bg-[#53FC18] text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse font-sans">99%</span>
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 font-medium">Final security checks & countdown.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">اكتمال 99% - اللمسات الأخيرة.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Winning Formula */}
            <div>
                 <div className="flex items-center gap-3 mb-8">
                    <div className="h-[1px] w-12 bg-[#53FC18]"></div>
                    <h3 className="text-[#53FC18] font-bold text-sm tracking-[0.2em] uppercase font-heading">The Winning Formula</h3>
                </div>

                <div className="space-y-0 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[#53FC18]/20 z-0"></div>
                    
                    {/* Formula 1 */}
                    <div className="relative z-10 flex gap-6 pb-8 group">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)] group-hover:bg-[#53FC18] group-hover:text-black transition-all duration-300">
                            <Zap size={20} className="text-[#53FC18] group-hover:text-black transition-colors" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-heading tracking-wide">
                                Engagement = Wealth
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 leading-relaxed font-medium">Interact to earn points, convert to $AKGS tokens. Your time is currency.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">تفاعلك هو ثروتك.. اجمع النقاط وحولها لتوكنات.</p>
                        </div>
                    </div>

                    {/* Formula 2 */}
                    <div className="relative z-10 flex gap-6 pb-8 group">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)] group-hover:bg-[#53FC18] group-hover:text-black transition-all duration-300">
                            <Tv size={20} className="text-[#53FC18] group-hover:text-black transition-colors" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-heading tracking-wide">
                                Kick Stream & NFT Power
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 leading-relaxed font-medium">Follow on Kick for NFT giveaways. NFTs reduce tax & boost rewards.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">تابعنا على Kick لفرص فوز بـ NFTs لتقليل الضريبة.</p>
                        </div>
                    </div>

                    {/* Formula 3 */}
                    <div className="relative z-10 flex gap-6 group">
                        <div className="w-10 h-10 rounded-full bg-black border border-[#53FC18] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(83,252,24,0.3)] group-hover:bg-[#53FC18] group-hover:text-black transition-all duration-300">
                            <HeartHandshake size={20} className="text-[#53FC18] group-hover:text-black transition-colors" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-white font-bold flex items-center gap-2 text-sm md:text-base font-heading tracking-wide">
                                The 90% Pledge
                            </h4>
                            <p className="text-gray-300 text-sm mt-1 leading-relaxed font-medium">We reinvest ~90% of profits back into the ecosystem to support YOU.</p>
                            <p className="text-[#53FC18] text-xs mt-1 font-arabic font-bold" dir="rtl">نستثمر 90% من الأرباح لدعم المجتمع والمشروع.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center gap-2 opacity-50 pb-8">
          <div className="w-2 h-2 rounded-full bg-[#53FC18] animate-pulse"></div>
          <span className="text-xs text-gray-500 uppercase tracking-[0.2em] font-heading">System Status: Pre-Launch</span>
        </div>
      </div>
    </div>
  );
};

export default AKGsannance;
