// Original tiny synthesizer. No audio assets or external requests.
let context,muted=false;
export function toggleMute(){muted=!muted;if(context)context.suspend();return muted;}
export function sound(kind='plot') {
  if(muted)return;
  try{
    context??=new (window.AudioContext||window.webkitAudioContext)();context.resume();
    const notes={plot:[440],sail:[196,294],charge:[262,330,392],rescue:[392,494,587,784],win:[262,330,392,523,659],lost:[196,165,131],error:[110,104]};
    (notes[kind]||notes.plot).forEach((frequency,i)=>{
      const at=context.currentTime+i*.085,osc=context.createOscillator(),gain=context.createGain();
      osc.type=kind==='sail'?'sine':'triangle';osc.frequency.value=frequency;
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.055,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+.3);
      osc.connect(gain);gain.connect(context.destination);osc.start(at);osc.stop(at+.32);
    });
  }catch{/* The game stays fully playable on devices without Web Audio. */}
}
