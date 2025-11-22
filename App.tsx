import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Pet, Task, HealthRecord, TrainingSession, ChatMessage } from './types';
import { Icons } from './components/Icons';
import { Button } from './components/Button';
import { generatePetAdvice } from './services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- Mock Data ---
const MOCK_PETS: Pet[] = [
  {
    id: 'p1',
    name: 'Buddy',
    type: 'Dog',
    breed: 'Golden Retriever',
    age: 3,
    weight: 32,
    image: 'https://picsum.photos/id/237/400/400',
    nextVetVisit: '2024-06-15'
  },
  {
    id: 'p2',
    name: 'Luna',
    type: 'Cat',
    breed: 'Siamese',
    age: 2,
    weight: 4.5,
    image: 'https://picsum.photos/id/40/400/400',
    nextVetVisit: '2024-08-20'
  }
];

const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Morning Feeding', time: '08:00 AM', completed: true, petId: 'p1', type: 'food' },
  { id: 't2', title: 'Heartworm Pill', time: '09:00 AM', completed: false, petId: 'p1', type: 'medication' },
  { id: 't3', title: 'Evening Walk', time: '06:00 PM', completed: false, petId: 'p1', type: 'walk' },
  { id: 't4', title: 'Clean Litterbox', time: '10:00 AM', completed: false, petId: 'p2', type: 'grooming' },
];

const MOCK_HEALTH: HealthRecord[] = [
  { id: 'h1', date: '2023-12-01', type: 'Vaccination', notes: 'Rabies booster', vet: 'Dr. Smith' },
  { id: 'h2', date: '2024-01-15', type: 'Checkup', notes: 'Healthy weight', vet: 'Dr. Smith' },
  { id: 'h3', date: '2024-03-10', type: 'Injury', notes: 'Minor paw scrape', vet: 'Dr. Doe' },
];

const MOCK_TRAINING: TrainingSession[] = [
  { date: 'Mon', command: 'Sit', durationMin: 15, successRate: 60 },
  { date: 'Tue', command: 'Sit', durationMin: 20, successRate: 75 },
  { date: 'Wed', command: 'Stay', durationMin: 10, successRate: 40 },
  { date: 'Thu', command: 'Sit', durationMin: 15, successRate: 85 },
  { date: 'Fri', command: 'Recall', durationMin: 30, successRate: 50 },
  { date: 'Sat', command: 'Recall', durationMin: 25, successRate: 65 },
  { date: 'Sun', command: 'Sit', durationMin: 10, successRate: 95 },
];

// --- Sub-Components ---

const Navbar = ({ title, onBack, onMenu }: { title: string, onBack?: () => void, onMenu?: () => void }) => (
  <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-4 flex items-center justify-between h-16">
    <div className="flex items-center gap-2">
      {onBack && (
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600">
          <Icons.Back size={24} />
        </button>
      )}
      <h1 className="text-lg font-bold text-slate-800 truncate">{title}</h1>
    </div>
    {onMenu && (
      <button onClick={onMenu} className="p-2 -mr-2 rounded-full hover:bg-slate-100 text-slate-600">
        <Icons.Menu size={24} />
      </button>
    )}
  </nav>
);

const BottomNav = ({ current, onChange }: { current: ViewState, onChange: (v: ViewState) => void }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe pt-2 px-6 h-20 flex justify-between items-start z-50">
    <button 
      onClick={() => onChange(ViewState.DASHBOARD)}
      className={`flex flex-col items-center gap-1 ${current === ViewState.DASHBOARD ? 'text-indigo-600' : 'text-slate-400'}`}
    >
      <Icons.Activity size={24} />
      <span className="text-xs font-medium">Home</span>
    </button>
    <button 
      onClick={() => onChange(ViewState.CALENDAR)}
      className={`flex flex-col items-center gap-1 ${current === ViewState.CALENDAR ? 'text-indigo-600' : 'text-slate-400'}`}
    >
      <Icons.Calendar size={24} />
      <span className="text-xs font-medium">Calendar</span>
    </button>
    <div className="relative -top-6">
      <button 
        onClick={() => onChange(ViewState.AI_HUB)}
        className="bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-transform active:scale-95"
      >
        <Icons.MessageCircle size={28} />
      </button>
    </div>
    <button 
      onClick={() => onChange(ViewState.TRAINING_LOGS)}
      className={`flex flex-col items-center gap-1 ${current === ViewState.TRAINING_LOGS ? 'text-indigo-600' : 'text-slate-400'}`}
    >
      <Icons.Training size={24} />
      <span className="text-xs font-medium">Training</span>
    </button>
    <button 
      onClick={() => onChange(ViewState.SETTINGS)}
      className={`flex flex-col items-center gap-1 ${current === ViewState.SETTINGS || current === ViewState.USER_PROFILE ? 'text-indigo-600' : 'text-slate-400'}`}
    >
      <Icons.Settings size={24} />
      <span className="text-xs font-medium">Settings</span>
    </button>
  </div>
);

// --- Views ---

const AuthView = ({ onLogin }: { onLogin: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <div className="flex justify-center mb-6 text-indigo-600">
        <Icons.Dog size={64} />
      </div>
      <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">PetPal</h2>
      <p className="text-center text-slate-500 mb-8">Manage your furry friends with AI</p>
      
      <div className="space-y-4">
        <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
        <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
        <Button onClick={onLogin} fullWidth>Sign In</Button>
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">Or continue with</span></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <Button variant="outline">Google</Button>
            <Button variant="outline">Apple</Button>
        </div>
      </div>
    </div>
  </div>
);

const OnboardingView = ({ onComplete }: { onComplete: () => void }) => (
  <div className="min-h-screen bg-white flex flex-col p-8">
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-64 h-64 bg-indigo-100 rounded-full flex items-center justify-center mb-8 relative overflow-hidden">
         <img src="https://picsum.photos/id/1025/400/400" alt="Dog" className="object-cover w-full h-full opacity-80 mix-blend-multiply" />
         <div className="absolute inset-0 flex items-center justify-center">
            <Icons.Activity size={80} className="text-indigo-600 drop-shadow-md" />
         </div>
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Track Health & Habits</h2>
      <p className="text-slate-500 max-w-xs">Monitor your pet's daily activities, health records, and get AI-powered veterinary advice instantly.</p>
    </div>
    <Button onClick={onComplete} fullWidth>Get Started</Button>
  </div>
);

const DashboardView = ({ 
  pets, 
  onSelectPet, 
  tasks, 
  onToggleTask, 
  user 
}: { 
  pets: Pet[], 
  onSelectPet: (pet: Pet) => void, 
  tasks: Task[], 
  onToggleTask: (id: string) => void,
  user: string
}) => {
  return (
    <div className="pb-24 space-y-6 animate-fade-in">
      <header className="px-6 pt-8 pb-2">
        <p className="text-slate-500">Good Morning,</p>
        <h2 className="text-2xl font-bold text-slate-800">{user}</h2>
      </header>

      {/* Pets Horizontal Scroll */}
      <section className="pl-6">
        <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Your Pets</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 pr-6 scrollbar-hide">
          {pets.map(pet => (
            <div 
              key={pet.id} 
              onClick={() => onSelectPet(pet)}
              className="flex-shrink-0 w-36 h-48 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden cursor-pointer transition-transform hover:scale-105"
            >
              <div className="h-32 w-full relative">
                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-white/90 p-1 rounded-full">
                    {pet.type === 'Dog' ? <Icons.Dog size={14} className="text-indigo-600" /> : <Icons.Cat size={14} className="text-teal-600" />}
                </div>
              </div>
              <div className="flex-1 p-3 flex flex-col justify-center">
                <h4 className="font-bold text-slate-800">{pet.name}</h4>
                <p className="text-xs text-slate-500">{pet.breed}</p>
              </div>
            </div>
          ))}
          {/* Add New Pet Button */}
          <div className="flex-shrink-0 w-36 h-48 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer">
            <Icons.Plus size={32} />
            <span className="text-xs font-medium mt-2">Add Pet</span>
          </div>
        </div>
      </section>

      {/* Tasks */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Today's Tasks</h3>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                {tasks.filter(t => t.completed).length}/{tasks.length} Done
            </span>
        </div>
        <div className="space-y-3">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className={`flex items-center p-4 rounded-xl border transition-all duration-200 ${task.completed ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <div 
                onClick={() => onToggleTask(task.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 cursor-pointer transition-colors ${task.completed ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}
              >
                {task.completed && <Icons.Check size={14} className="text-white" />}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{task.time}</span>
                    <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 rounded-md text-slate-500 capitalize">{task.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const PetProfileView = ({ pet, onBack, onNavigate }: { pet: Pet, onBack: () => void, onNavigate: (v: ViewState) => void }) => (
  <div className="pb-24 animate-fade-in">
    <div className="relative h-72">
      <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
      <button onClick={onBack} className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition">
        <Icons.Back size={24} />
      </button>
      <div className="absolute bottom-0 left-0 w-full p-6 text-white">
        <h1 className="text-4xl font-bold mb-1">{pet.name}</h1>
        <p className="text-lg opacity-90">{pet.breed} • {pet.age} yrs</p>
      </div>
    </div>

    <div className="px-6 -mt-6 relative z-10">
      <div className="bg-white rounded-2xl shadow-lg p-6 flex justify-between items-center mb-6">
        <div className="text-center">
            <p className="text-xs text-slate-400 uppercase font-bold">Weight</p>
            <p className="text-xl font-bold text-slate-800">{pet.weight} <span className="text-sm font-normal text-slate-500">kg</span></p>
        </div>
        <div className="w-px h-8 bg-slate-200"></div>
        <div className="text-center">
            <p className="text-xs text-slate-400 uppercase font-bold">Next Vet</p>
            <p className="text-xl font-bold text-slate-800">{new Date(pet.nextVetVisit).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
        </div>
        <div className="w-px h-8 bg-slate-200"></div>
        <div className="text-center">
            <p className="text-xs text-slate-400 uppercase font-bold">Status</p>
            <p className="text-xl font-bold text-emerald-500">Healthy</p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Management</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div onClick={() => onNavigate(ViewState.HEALTH_RECORDS)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-200 transition-colors">
            <div className="p-3 bg-red-50 text-red-500 rounded-full">
                <Icons.Medical size={24} />
            </div>
            <span className="font-medium text-slate-700">Health Logs</span>
        </div>
        <div onClick={() => onNavigate(ViewState.TRAINING_LOGS)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-200 transition-colors">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-full">
                <Icons.Training size={24} />
            </div>
            <span className="font-medium text-slate-700">Training</span>
        </div>
        <div onClick={() => onNavigate(ViewState.CALENDAR)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-200 transition-colors">
            <div className="p-3 bg-purple-50 text-purple-500 rounded-full">
                <Icons.Calendar size={24} />
            </div>
            <span className="font-medium text-slate-700">Schedule</span>
        </div>
        <div onClick={() => onNavigate(ViewState.AI_HUB)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-200 transition-colors">
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-full">
                <Icons.MessageCircle size={24} />
            </div>
            <span className="font-medium text-slate-700">Ask AI</span>
        </div>
      </div>
    </div>
  </div>
);

const AIHubView = ({ activePet }: { activePet: Pet | null }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      role: 'model', 
      text: activePet 
        ? `Hi! I'm here to help with ${activePet.name}. Ask me about their diet, behavior, or health.` 
        : "Hi! I'm your veterinary assistant. Select a pet or ask general animal care questions!", 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare history for context
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await generatePetAdvice(input, activePet, history);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50">
      <Navbar title={activePet ? `Chat about ${activePet.name}` : 'LLM Hub'} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-white text-slate-700 rounded-tl-sm border border-slate-100'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100">
                    <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2">
            <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={activePet ? `Ask about ${activePet.name}...` : "Type your question..."}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Icons.MessageCircle size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

const HealthRecordsView = ({ records }: { records: HealthRecord[] }) => (
  <div className="pb-24 animate-fade-in px-6">
      <div className="flex justify-between items-center mb-6 pt-6">
          <h2 className="text-xl font-bold text-slate-800">Recent Records</h2>
          <Button variant="secondary" className="!px-3 !py-2 text-sm"><Icons.Plus size={16} /> Add</Button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Note</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {records.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{rec.date}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{rec.type}</td>
                          <td className="px-4 py-3 text-slate-600">{rec.notes}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
  </div>
);

const TrainingLogsView = () => (
    <div className="pb-24 animate-fade-in px-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 pt-6">Training Progress</h2>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-4">Success Rate (Last 7 Days)</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MOCK_TRAINING}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="successRate" 
                            stroke="#4f46e5" 
                            strokeWidth={3} 
                            dot={{r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} 
                            activeDot={{r: 6}}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-400 mb-4">Weekly Duration (Minutes)</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_TRAINING}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px'}} />
                        <Bar dataKey="durationMin" fill="#14b8a6" radius={[6, 6, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
);

const CalendarView = ({ pets }: { pets: Pet[] }) => {
    // Simplistic list view for calendar for this demo
    const events = [
        { id: 1, title: 'Vet Appointment', date: 'Tomorrow, 10:00 AM', type: 'medical', pet: pets[0] },
        { id: 2, title: 'Grooming Session', date: 'Sat Jun 24, 2:00 PM', type: 'grooming', pet: pets[1] },
        { id: 3, title: 'Training Class', date: 'Sun Jun 25, 11:00 AM', type: 'training', pet: pets[0] },
    ];

    return (
        <div className="pb-24 animate-fade-in px-6">
            <div className="flex justify-between items-center mb-6 pt-6">
                <h2 className="text-xl font-bold text-slate-800">Schedule</h2>
                <div className="flex -space-x-2">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-600">Doc</div>
                   <div className="w-8 h-8 rounded-full bg-teal-100 border-2 border-white flex items-center justify-center text-xs font-bold text-teal-600">Rm</div>
                </div>
            </div>

            <div className="space-y-4">
                {events.map(evt => (
                    <div key={evt.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 
                            ${evt.type === 'medical' ? 'bg-red-50 text-red-500' : 
                              evt.type === 'grooming' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                            {evt.type === 'medical' ? <Icons.Medical size={20} /> : 
                             evt.type === 'grooming' ? <Icons.Cat size={20} /> : <Icons.Training size={20} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800">{evt.title}</h4>
                            <p className="text-sm text-slate-500 mb-1">{evt.date}</p>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full overflow-hidden">
                                    <img src={evt.pet.image} className="w-full h-full object-cover" alt="" />
                                </div>
                                <span className="text-xs font-medium text-slate-400">{evt.pet.name}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SettingsView = ({ onNavigate, onLogout }: { onNavigate: (v: ViewState) => void, onLogout: () => void }) => (
  <div className="pb-24 animate-fade-in px-6">
    <h2 className="text-xl font-bold text-slate-800 mb-6 pt-6">Settings</h2>
    
    <div className="space-y-4">
      {/* User Profile Card */}
      <div 
        onClick={() => onNavigate(ViewState.USER_PROFILE)}
        className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md"
      >
        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl mr-4 border-2 border-white shadow-sm">
          A
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-lg">Alex</h3>
          <p className="text-sm text-slate-500">Edit Profile</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
            <Icons.Back className="rotate-180 text-slate-400" size={18} />
        </div>
      </div>

      {/* App Settings Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {[
            { label: 'Notifications', icon: Icons.MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Privacy & Security', icon: Icons.Check, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Connected Accounts', icon: Icons.User, color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: 'Help & Support', icon: Icons.Activity, color: 'text-orange-500', bg: 'bg-orange-50' }
        ].map((item, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                        <item.icon size={18} />
                    </div>
                    <span className="text-slate-700 font-medium">{item.label}</span>
                </div>
                <Icons.Back className="rotate-180 text-slate-400" size={18} />
            </div>
        ))}
      </div>
      
      {/* App Info */}
      <div className="text-center py-4">
          <p className="text-xs text-slate-400">PetPal v1.0.2</p>
      </div>

      <Button variant="ghost" fullWidth onClick={onLogout} className="text-red-500 hover:bg-red-50 hover:text-red-600 border border-slate-100 bg-white shadow-sm">
        <Icons.Logout size={18} />
        Sign Out
      </Button>
    </div>
  </div>
);

const UserProfileView = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="pb-24 animate-fade-in px-6">
            <div className="flex flex-col items-center mb-8 pt-6">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-4xl border-4 border-white shadow-lg mb-4">
                        A
                    </div>
                    <button className="absolute bottom-4 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-md hover:bg-indigo-700 transition-colors border-2 border-white">
                        <Icons.Settings size={16} />
                    </button>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Alex Johnson</h2>
                <p className="text-slate-500">alex.johnson@example.com</p>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
                    <input type="text" defaultValue="Alex Johnson" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
                    <input type="email" defaultValue="alex.johnson@example.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Phone Number</label>
                    <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700" />
                </div>
                
                <div className="pt-4">
                    <Button fullWidth>Save Changes</Button>
                </div>
            </form>
        </div>
    );
};

// --- Main Component ---

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.AUTH);
  const [activePet, setActivePet] = useState<Pet | null>(null);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  
  // Navigation Handlers
  const handleLogin = () => setView(ViewState.ONBOARDING);
  const handleOnboardingComplete = () => setView(ViewState.DASHBOARD);
  const handleLogout = () => setView(ViewState.AUTH);
  
  const handlePetSelect = (pet: Pet) => {
    setActivePet(pet);
    setView(ViewState.PET_PROFILE);
  };

  const handleTaskToggle = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const renderView = () => {
    switch (view) {
      case ViewState.AUTH:
        return <AuthView onLogin={handleLogin} />;
      case ViewState.ONBOARDING:
        return <OnboardingView onComplete={handleOnboardingComplete} />;
      case ViewState.DASHBOARD:
        return <DashboardView 
                  pets={MOCK_PETS} 
                  onSelectPet={handlePetSelect} 
                  tasks={tasks} 
                  onToggleTask={handleTaskToggle}
                  user="Alex"
               />;
      case ViewState.PET_PROFILE:
        return activePet ? <PetProfileView pet={activePet} onBack={() => setView(ViewState.DASHBOARD)} onNavigate={setView} /> : null;
      case ViewState.AI_HUB:
        return <AIHubView activePet={activePet} />;
      case ViewState.HEALTH_RECORDS:
        return <HealthRecordsView records={MOCK_HEALTH} />;
      case ViewState.TRAINING_LOGS:
        return <TrainingLogsView />;
      case ViewState.CALENDAR:
        return <CalendarView pets={MOCK_PETS} />;
      case ViewState.SETTINGS:
        return <SettingsView onNavigate={setView} onLogout={handleLogout} />;
      case ViewState.USER_PROFILE:
        return <UserProfileView onBack={() => setView(ViewState.SETTINGS)} />;
      default:
        return <DashboardView pets={MOCK_PETS} onSelectPet={handlePetSelect} tasks={tasks} onToggleTask={handleTaskToggle} user="Alex" />;
    }
  };

  // Don't show bottom nav on Auth/Onboarding or Deep Pet Profile (optional choice, kept it simple)
  const showNav = view !== ViewState.AUTH && view !== ViewState.ONBOARDING;
  // Show Top Nav on specific pages where we haven't built custom headers
  const showHeader = [ViewState.HEALTH_RECORDS, ViewState.TRAINING_LOGS, ViewState.CALENDAR, ViewState.SETTINGS, ViewState.USER_PROFILE].includes(view);
  
  const getTitle = () => {
    switch(view) {
        case ViewState.HEALTH_RECORDS: return 'Health Records';
        case ViewState.TRAINING_LOGS: return 'Training';
        case ViewState.CALENDAR: return 'Calendar';
        case ViewState.SETTINGS: return 'Settings';
        case ViewState.USER_PROFILE: return 'My Profile';
        default: return 'PetPal';
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen shadow-2xl overflow-hidden relative">
      {showHeader && (
          <Navbar 
            title={getTitle()}
            onBack={
                // Settings is a root tab, no back button. Profile goes back to Settings. Others go to Profile or Dashboard.
                view === ViewState.SETTINGS ? undefined : 
                () => {
                    if (view === ViewState.USER_PROFILE) setView(ViewState.SETTINGS);
                    else setView(activePet ? ViewState.PET_PROFILE : ViewState.DASHBOARD);
                }
            } 
          />
      )}
      
      {renderView()}
      
      {showNav && (
        <BottomNav current={view} onChange={(v) => {
            // If clicking home, clear active pet so we go to main dash, not pet profile
            if(v === ViewState.DASHBOARD) setActivePet(null);
            setView(v);
        }} />
      )}
    </div>
  );
}