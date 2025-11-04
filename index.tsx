
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Modality, Type } from "@google/genai";

// --- Type Definitions ---
interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    imageFile?: File | null;
}

interface Subject {
    name: string;
    icon: string;
    url: string;
}

interface Grade {
    name: string;
    subjects: Subject[];
}

interface Stage {
    name: string;
    icon: string;
    grades: Grade[];
}

interface MindMapNode {
    topic: string;
    children?: MindMapNode[];
}

// Props Interfaces
interface BottomNavProps {
    activePage: string;
    setActivePage: (page: string) => void;
}

interface MarkdownRendererProps {
    text: string;
}

interface ChatPageProps {
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

interface SettingsPageProps {
    onBack: () => void;
}

interface MindMapRendererProps {
    data: MindMapNode;
    colorScheme: string;
}

// --- Helper function to calculate a darker shade of a color ---
const shadeColor = (color: string, percent: number): string => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(String(R * (100 + percent) / 100));
    G = parseInt(String(G * (100 + percent) / 100));
    B = parseInt(String(B * (100 + percent) / 100));

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
};

// --- Main App Component ---
const App = () => {
  const [activePage, setActivePage] = useState('chat');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // --- Theme Management ---
    const applyTheme = () => {
        // Mode
        const themeMode = localStorage.getItem('themeMode') || 'auto';
        if (themeMode === 'dark' || (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Color
        const themeColor = localStorage.getItem('themeColor') || '#B89F71';
        const darkColor = shadeColor(themeColor, -20);
        document.documentElement.style.setProperty('--primary-color', themeColor);
        document.documentElement.style.setProperty('--primary-dark', darkColor);

        // RGB variable for glow effect
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(themeColor);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            document.documentElement.style.setProperty('--primary-color-rgb', `${r}, ${g}, ${b}`);
        }

        // Background Pattern
        const appBackground = localStorage.getItem('appBackground') || 'none';
        if (appBackground && appBackground !== 'none') {
            document.body.style.backgroundImage = `url(${appBackground})`;
        } else {
            document.body.style.backgroundImage = 'none';
        }
    };
    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        const themeMode = localStorage.getItem('themeMode') || 'auto';
        if (themeMode === 'auto') {
            applyTheme();
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    
    // --- Notification Management ---
    const manageMotivationalNotifications = () => {
        if (!('Notification' in window)) {
            console.log("This browser does not support desktop notification");
            return;
        }

        const LAST_VISIT_KEY = 'lastVisitTimestamp';
        const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
        const wasInactive = lastVisit && (now - parseInt(lastVisit, 10) > TWENTY_FOUR_HOURS_MS);

        const showNotification = () => {
            const motivationalMessages = [
                "أهلاً بعودتك! هل أنت مستعد لجلسة دراسية مثمرة اليوم؟",
                "لقد اشتقنا إليك! لنبدأ رحلة التعلم من جديد.",
                "العلم ينتظرك! ما الذي تود اكتشافه في التطبيق اليوم؟",
                "يوم جديد، فرصة جديدة للتعلم. نحن هنا لمساعدتك."
            ];
            const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
            
            new Notification('تطبيق الطالب السوري', {
                body: randomMessage,
                icon: 'https://i.imgur.com/gL342tY.png' // Book icon
            });
        };

        if (Notification.permission === 'granted') {
            if (wasInactive) {
                showNotification();
            }
        } else if (Notification.permission === 'default') {
            const requestPermission = () => {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted' && wasInactive) {
                        showNotification();
                    }
                });
            };

            // If user is returning after inactivity, ask for permission right away.
            // Otherwise, delay the request to be less intrusive for new users.
            if (wasInactive) {
                requestPermission();
            } else {
                setTimeout(requestPermission, 5000); // 5-second delay for new users
            }
        }
        
        // Always update the last visit timestamp
        localStorage.setItem(LAST_VISIT_KEY, now.toString());
    };

    manageMotivationalNotifications();
    
    return () => mediaQuery.removeEventListener('change', handleChange);
}, []);


  const renderPage = () => {
    switch (activePage) {
      case 'chat':
        return <ChatPage messages={chatHistory} setMessages={setChatHistory} />;
      case 'books':
        return <BooksPage />;
      case 'tools':
        return <ToolsPage />;
      case 'suggestions':
        return <SuggestionsPage />;
      default:
        return <ChatPage messages={chatHistory} setMessages={setChatHistory} />;
    }
  };

  return (
    <>
      <div className="app-container">
        <div className="top-bar"></div>
        <div className="app-header-decoration">
            <div className="app-handle"></div>
        </div>
        <main className="content-container">
            {renderPage()}
        </main>
        <BottomNav activePage={activePage} setActivePage={setActivePage} />
      </div>
    </>
  );
};

// --- Enhanced Loader Component ---
const EnhancedLoader: React.FC<{ messages: string[] }> = ({ messages }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
        }, 3000); // Change message every 3 seconds

        return () => clearInterval(interval);
    }, [messages.length]);

    return (
        <div className="enhanced-loader">
            <div className="loader-icon">
                <span className="material-icons">auto_awesome</span>
            </div>
            <p className="loader-message">{messages[currentMessageIndex]}</p>
        </div>
    );
};

// --- Bottom Navigation Component ---
const BottomNav: React.FC<BottomNavProps> = ({ activePage, setActivePage }) => {
    const navRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const audioCtxRef = useRef<AudioContext | null>(null);

    // --- Sound Effect Function ---
    const playClickSound = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioCtx = audioCtxRef.current;
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Sound parameters for a short "click"
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // High pitch

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.1);
    };

    const navItems = [
        { id: 'chat', icon: 'chat_bubble', label: 'الدردشة' },
        { id: 'books', icon: 'menu_book', label: 'الكتب' },
        { id: 'tools', icon: 'apps', label: 'الأدوات' },
        { id: 'suggestions', icon: 'lightbulb', label: 'الاقتراحات' },
    ];

    useEffect(() => {
        const activeElement = navRef.current?.querySelector('.nav-button.active') as HTMLElement;
        if (activeElement) {
            // The pill will be slightly smaller than the button for a nice padded look.
            const indicatorPadding = 12; // horizontal padding for the pill inside the button
            const indicatorWidth = activeElement.offsetWidth - indicatorPadding;
            const left = activeElement.offsetLeft + (indicatorPadding / 2);
            setIndicatorStyle({ left: `${left}px`, width: `${indicatorWidth}px` });
        }
    }, [activePage]);

    const handleNavClick = (pageId: string) => {
        playClickSound();
        setActivePage(pageId);
    };

    return (
        <nav className="bottom-nav" ref={navRef}>
            <div className="nav-indicator" style={indicatorStyle}></div>
            {navItems.map((item) => (
                <button
                    key={item.id}
                    className={`nav-button ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    aria-label={item.label}
                >
                    <span className="material-icons">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

// --- Helper Functions ---
const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        } else {
            reject(new Error('Failed to read file as a data URL string.'));
        }
    };
    reader.onerror = error => reject(error);
});

// --- Markdown Renderer ---
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
    const toHtml = (markdown: string) => {
        // Clean up markdown before processing
        const cleanedMarkdown = markdown.replace(/```markdown/g, '').replace(/```/g, '').trim();

        const blocks = cleanedMarkdown.split(/\n\n+/); 
        
        const html = blocks.map((block: string) => {
            let processedBlock = block
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            processedBlock = processedBlock
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');

            if (processedBlock.match(/^\s*([-*]|\d+\.)/)) {
                // This is a list, process it line by line preserving nesting
                const lines = processedBlock.split('\n');
                let htmlList = '';
                let listStack: string[] = []; // To keep track of open lists (ul/ol)

                lines.forEach((line: string) => {
                    if (!line.trim()) return;

                    const indentMatch = line.match(/^\s*/);
                    const indentLevel = indentMatch ? indentMatch[0].length / 2 : 0; // Assuming 2 spaces for indent
                    const content = line.trim().replace(/^([-*]|\d+\.)\s*/, '');
                    const isOrdered = /^\d+\./.test(line.trim());
                    const listType = isOrdered ? 'ol' : 'ul';

                    while (listStack.length > indentLevel) {
                        htmlList += `</${listStack.pop()}>`;
                    }

                    if (listStack.length < indentLevel || (listStack.length > 0 && listStack[listStack.length - 1] !== listType)) {
                         if (listStack.length > 0 && listStack[listStack.length - 1] !== listType && listStack.length === indentLevel) {
                            htmlList += `</${listStack.pop()}>`;
                         }
                         htmlList += `<${listType}>`;
                         listStack.push(listType);
                    }
                    
                    htmlList += `<li>${content}</li>`;
                });

                while (listStack.length > 0) {
                    htmlList += `</${listStack.pop()}>`;
                }
                return htmlList;
            }
            else {
                return `<p>${processedBlock.replace(/\n/g, '<br/>')}</p>`;
            }
        }).join('');
        return { __html: html };
    };

    return <div className="message-text-content" dangerouslySetInnerHTML={toHtml(text)} />;
};

// --- Chat Page Component ---
const ChatPage: React.FC<ChatPageProps> = ({ messages, setMessages }) => {
    const [inputValue, setInputValue] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [chatSuggestions, setChatSuggestions] = useState<string[]>([]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const allSuggestions = [
        'اشرح لي قاعدة فيثاغورس',
        'لخص لي نصاً عن الثورة الصناعية',
        'كيف أكتب موضوع تعبير؟',
        'ما هي خطوات المنهج العلمي؟',
        'ترجم لي هذه الجملة: "Knowledge is power"',
        'أعطني مثالاً على التشبيه في الشعر',
        'ما هي عاصمة البرازيل؟',
        'ساعدني في فهم مسألة في الكيمياء',
        'حل لي هذه المعادلة: 2x + 5 = 15',
        'ما الفرق بين الطقس والمناخ؟',
        'اكتب لي قصيدة قصيرة عن الأمل',
        'من هو ابن خلدون؟'
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowWelcomeModal(true);
        }, 3000);
        
        const shuffled = [...allSuggestions].sort(() => 0.5 - Math.random());
        setChatSuggestions(shuffled.slice(0, 3));

        return () => clearTimeout(timer);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setImage(event.target.files[0]);
            (event.target as HTMLInputElement).value = ''; // Reset to allow re-selecting same file
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
    };
    
    const handleSendMessage = async (prompt?: string) => {
        const textToSend = (typeof prompt === 'string' ? prompt : inputValue).trim();
        const imageToSend = image;

        if (!textToSend && !imageToSend) return;

        const userMessage: ChatMessage = { role: 'user', text: textToSend, imageFile: imageToSend };
        const newMessages: ChatMessage[] = [...messages, userMessage];
        setMessages(newMessages);

        setInputValue('');
        setImage(null);
        setIsLoading(true);

        try {
            // Construct the payload with only the current message
            const parts: any[] = [];
            if (userMessage.text) {
                parts.push({ text: userMessage.text });
            }
            if (userMessage.imageFile) {
                const base64Data = await fileToBase64(userMessage.imageFile);
                parts.push({
                    inlineData: { mimeType: userMessage.imageFile.type, data: base64Data },
                });
            }
            
            const currentMessagePayload = { role: userMessage.role, parts };
            const contents = [currentMessagePayload];

            const response = await fetch('/.netlify/functions/gemini-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gemini-2.5-flash',
                    contents: contents,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Proxy request failed with status ${response.status}: ${errorText}`);
            }

            const responseData = await response.json();
            
            const aiText = responseData.text || 'عذراً، لم أتلق رداً صالحاً.';

            const aiMessage: ChatMessage = { role: 'model', text: aiText };
            setMessages([...newMessages, aiMessage]);

        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: ChatMessage = { role: 'model', text: 'عذراً، حدث خطأ ما. الرجاء المحاولة مرة أخرى.' };
            setMessages([...newMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };


    const handleCloseModal = () => {
        setShowWelcomeModal(false);
    };

    return (
        <div className="page chat-page">
            {showWelcomeModal && (
                <div className="welcome-toast">
                    <div className="toast-content">
                        <h4>ملاحظة هامة</h4>
                        <p>سيتم تدريب هذا النموذج قريبًا على المنهج الدراسي السوري الحديث لتقديم إجابات أكثر دقة وتخصصًا.</p>
                    </div>
                    <button onClick={handleCloseModal} className="toast-close-btn" aria-label="إغلاق">&times;</button>
                </div>
            )}
            <div className="chat-history">
                {messages.length === 0 && !isLoading && (
                    <div className="chat-welcome-container">
                        <span className="material-icons">auto_awesome</span>
                        <h3>مرحباً بك! كيف يمكنني مساعدتك اليوم؟</h3>
                        <div className="chat-suggestions">
                            {chatSuggestions.map((suggestion, index) => (
                                <button key={index} onClick={() => handleSendMessage(suggestion)}>{suggestion}</button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((msg: ChatMessage, index: number) => (
                    <div key={index} className={`message-bubble ${msg.role}`}>
                         {msg.imageFile && <img src={URL.createObjectURL(msg.imageFile)} alt="User upload" className="chat-image" />}
                         {msg.text && (
                           msg.role === 'model' 
                           ? <MarkdownRenderer text={msg.text} /> 
                           : <p className="message-text">{msg.text}</p>
                        )}
                    </div>
                ))}
                 {isLoading && (
                    <div className="message-bubble model">
                        <div className="loading-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-container">
                {image && (
                    <div className="image-preview-container">
                        <img src={URL.createObjectURL(image)} alt="Preview" />
                        <button onClick={handleRemoveImage} className="remove-image-btn" aria-label="Remove image">
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                )}
                <div className="chat-input-area">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                        aria-hidden="true"
                    />
                     <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isLoading} 
                        aria-label="Attach image"
                    >
                        <span className="material-icons">add_photo_alternate</span>
                    </button>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="اكتب رسالتك هنا..."
                        aria-label="إدخال الدردشة"
                        disabled={isLoading}
                    />
                    <button 
                        onClick={() => handleSendMessage()} 
                        disabled={isLoading || (!inputValue.trim() && !image)} 
                        aria-label="إرسال رسالة"
                    >
                        <span className="material-icons">send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Books Page Component ---
const BooksPage = () => {
    const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

    const stages: Stage[] = [
        {
            name: 'المرحلة الابتدائية',
            icon: 'child_care',
            grades: [
                { name: 'الصف الأول', subjects: [ { name: 'الرياضيات (الفصل الأول)', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1TnCylQZ7qKY7XEw-Qo2vr7uu-BpBC8Mj' }, { name: 'الرياضيات (الفصل الثاني)', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1pBG_bU66WtgEDRdvMBGqAH82WQP7S5qs' }, { name: 'العلوم (الفصل الأول)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1kJXYTqWrS1UhbxsilSEEqMxqRYKiiTh2' }, { name: 'العلوم (الفصل الثاني)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=16HWSu4CfllLyk6nOhje2K6q9n7DYj4an' }, { name: 'اللغة العربية (فصل أول)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=12unENA6S9VJQeYkbzkxRARZUvVkd8jKO' }, { name: 'اللغة العربية (فصل ثاني)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1F0btzUkiru74_6H3n3AyMH2hLr8rIdFN' }, { name: 'اللغة الإنكليزية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1Hx-tv1MoTEhysqdwgRQsKhohOYEO-7ez' }, { name: 'اللغة الإنكليزية (كتاب التمارين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1_Jra5xK8oqFUNrYXC1cDdTTvY23zutZH' }, { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1v6cvKWgsgHRBC3qAQry8VvgGL_4TbMIm' }, { name: 'الموسيقى', icon: 'music_note', url: 'https://drive.google.com/uc?export=download&id=1ltkngUTw29rh8ZLeY7U1YFJEpV08kFb7' }, { name: 'الدراسات الاجتماعية', icon: 'public', url: 'https://drive.google.com/uc?export=download&id=12rDoiaduORslwwigbMU8Y3bcz4MlknJO' }, { name: 'الديانة المسيحية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1NiopNk0TfyYXsmBwxcpjFfOI8UHnptOQ' }, { name: 'الفنون', icon: 'palette', url: 'https://drive.google.com/uc?export=download&id=14kSTZLlSO_SKD8nk-RdqYyNJOXfYEDZR' } ] },
                { name: 'الصف الثاني', subjects: [ { name: 'اللغة العربية (فصل أول)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1C41bpOxorJU6d__CNry9WohIYDTBK-np' }, { name: 'اللغة العربية (فصل ثاني)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1bLkxtYS6ym9YsXly1HzZ83Sd6E2Ha879' }, { name: 'الفنون', icon: 'palette', url: 'https://drive.google.com/uc?export=download&id=19tfYmIMpq2M7HhY92Dep6gaWawHKwz1k' }, { name: 'الديانة المسيحية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1DDj39gMMqOcpxzLn3iOAqCrR38QlDkrR' }, { name: 'اللغة الإنكليزية (كتاب التمارين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1HBZP5YyzoYRhAHcUEvECG2b1zjJWlqyw' }, { name: 'اللغة الإنكليزية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1Qdg-3kdI1X5sFRtMQk5uWZB24vRZqpbK' }, { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1p1IlODXabxZgTDZKOH0jt2d_sr3uo7EL' }, { name: 'الرياضيات (فصل أول)', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1hc6oNsAw5PGZjuHR8RgEw8gPpNEinX3e' }, { name: 'الرياضيات (فصل ثاني)', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1VzwCLAH3tE-OAquAUGxKEO6daJWTx-TA' }, { name: 'الموسيقى', icon: 'music_note', url: 'https://drive.google.com/uc?export=download&id=1UzTuVXz3aPCAF-pAwv1-tVa07tQrEVJx' }, { name: 'العلوم (فصل أول)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1I8enxrqh3lQ0se7f66X1xZ6Uc1A0tnsN' }, { name: 'العلوم (فصل ثاني)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1GrFyNESdQC2lbnvihJaIi6GUIYxLPjCj' }, { name: 'الدراسات الاجتماعية', icon: 'public', url: 'https://drive.google.com/uc?export=download&id=18UqD5GI3BY1vW2Y7WOxaiN_OgrWWs_3U' } ] },
                { name: 'الصف الثالث', subjects: [ { name: 'اللغة العربية (فصل أول)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1FH9pizdg3OszpocYdmek3wx2vb8GRTvY' }, { name: 'اللغة العربية (فصل ثاني)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=10Nn4H-d_ejtoCN7gLGc95foomJU7WZ4w' }, { name: 'الفنون', icon: 'palette', url: 'https://drive.google.com/uc?export=download&id=1DAmEW1JiyzocDj_Sq1bkWzx7dSvlhAi8' }, { name: 'الديانة المسيحية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1-ySKgJQhLRV4paflPxZ2794ioyMyDLFp' }, { name: 'اللغة الإنكليزية (كتاب التمارين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1MbAG0zkWkksTT_C12Quk1W5vcOKLUS9h' }, { name: 'اللغة الإنkليزية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1WXXgigJLQVcXeiXofgNK2Yr6g5f3ZkDK' }, { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1o_w6WRwSpS8FZ4rmpOvu-3fG2sSYLbM2' }, { name: 'الرياضيات', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1suiqkaNtYpNTfX8XZ-j_-Z5p5iW0SaJc' }, { name: 'الموسيقى', icon: 'music_note', url: 'https://drive.google.com/uc?export=download&id=14BfmigSiSNpgS5JUEs8A6RxleAu_d2kn' }, { name: 'العلوم (فصل أول)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=12P4Puu6pFqQ5kzK2qcveS5sVPqXkExaf' }, { name: 'العلوم (فصل ثاني)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1rmkdOF4f3gf7GwH6wEyT7Q-iRWNndKV4' }, { name: 'الدراسات الاجتماعية', icon: 'public', url: 'https://drive.google.com/uc?export=download&id=1PGF2m5Yb8EPrQnqcahTOJ41BBHpg9e9T' } ] },
                { name: 'الصف الرابع', subjects: [ { name: 'اللغة العربية (فصل أول)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1FSlLrQavjFa3mOhlBBQMYnANEYZxP_CV' }, { name: 'اللغة العربية (فصل ثاني)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1dS9y-tPkjqmwX05vBQoHie7mvV0Zltiw' }, { name: 'الفنون', icon: 'palette', url: 'https://drive.google.com/uc?export=download&id=1vH99kO2NllU0gJErjz8yKO8V4HTJqtDM' }, { name: 'الديانة المسيحية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1-iYkMXv7Cxi44fLYoov32O1SCHt9dAUD' }, { name: 'اللغة الإنكليزية (كتاب التمارين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1RTkPZ20qIqJDzzyWPWUPHKEP-vVbgTst' }, { name: 'اللغة الإنكليزية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=18LFhWJ3GAs2UfRFl6GRxg8PhOE8yuSwG' }, { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1iMsviYvlR-FPO4PS9jC0C9zJwZp9tYAh' }, { name: 'الرياضيات', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1WJiivgPOF3ZEZqCQq1amPfjk15gknyko' }, { name: 'الموسيقى', icon: 'music_note', url: 'https://drive.google.com/uc?export=download&id=1vhJcLIP34kK5jWOUyrXEo3tE9Uuj_rI1' }, { name: 'العلوم (فصل أول)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1N5dIudTRW-TnXGBHekgz2hBKpVXSw4UO' }, { name: 'العلوم (فصل ثاني)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1-jhmMiyyF4yoi6bG8ZewX0KfWa7WYlia' }, { name: 'الدراسات الاجتماعية', icon: 'public', url: 'https://drive.google.com/uc?export=download&id=1J0yhI_f__ugVkUI7G4Kps34IcbdfUwbE' }, { name: 'التربية المهنية (فصل أول)', icon: 'build', url: 'https://drive.google.com/uc?export=download&id=1xs6MTvUKJ16C77qmyunMzdfVwfvU8D-k' }, { name: 'التربية المهنية (فصل ثاني)', icon: 'build', url: 'https://drive.google.com/uc?export=download&id=1tUkHMqyY85AbW_ilpK4bo3yXURGDbXTd' } ] },
                { name: 'الصف الخامس', subjects: [ { name: 'اللغة العربية (فصل أول)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1N8oCCbDdXJvtnzlxY-91s_YbyS3JIL4Q' }, { name: 'اللغة العربية (فصل ثاني)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1HpXD1cdtJmVTXJOhDrRj-k3WZ9IBxvDT' }, { name: 'الفنون', icon: 'palette', url: 'https://drive.google.com/uc?export=download&id=1JDs-El1_LcvFaN5rieyhAD2A0k0Y0KLy' }, { name: 'الديانة المسيحية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=17Fetm1DbtSmXdS38fm26IVC9Vz022BVC' }, { name: 'اللغة الإنكليزية (كتاب التمارين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=12GuG6T3qkS1aFS3GdkHKOgQibMa1DtEL' }, { name: 'اللغة الإنكليزية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1NkMXf8U5CMBe5ySXTiONLtSpXyF62R58' }, { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1AtU-pZjBRfTHbTTKxqWjSeuKr1Ri4PMS' }, { name: 'الرياضيات', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1fleAPXHix4IIFDcyW5AzZf12n7whSm5e' }, { name: 'الموسيقى', icon: 'music_note', url: 'https://drive.google.com/uc?export=download&id=17NfXszpg4Y2Ad_CP7zR-wKl4xTnO4rRB' }, { name: 'العلوم (فصل أول)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1TAPqvDo8h6k7TwQNadz1Dbvy5FOiBjpF' }, { name: 'العلوم (فصل ثاني)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1nrzBO57cezc8t5cHX0xvhhxNUqcJ6Krx' }, { name: 'التربية المهنية (فصل أول)', icon: 'build', url: 'https://drive.google.com/uc?export=download&id=1nrzBO57cezc8t5cHX0xvhhxNUqcJ6Krx' }, { name: 'التربية المهنية (فصل ثاني)', icon: 'build', url: 'https://drive.google.com/uc?export=download&id=1G0RkhXHjkA1xQCPv2JpyCoYjvDl8k9bt' } ] },
                { name: 'الصف السادس', subjects: [ { name: 'اللغة العربية (فصل أول)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1xTRTBQWPJVbbRMHBZpy88ZscWM6LE_D1' }, { name: 'اللغة العربية (فصل ثاني)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1ewPBvJN76ud-ksgw0izDCXgiKhTCk9us' }, { name: 'الفنون', icon: 'palette', url: 'https://drive.google.com/uc?export=download&id=17ZZmZanQ_yReYMoqppjuZ4fMdZjFfmXj' }, { name: 'الديانة المسيحية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1xlzBnxyBCtjZAN5Mes1E8BuAnsKq8Pyb' }, { name: 'اللغة الإنكليزية (كتاب التمارين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1nIrt_yazEiDYwMnkvDhYMby4Y-8EVeUv' }, { name: 'اللغة الإنكليزية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1sWClsTGi06IMm0rDgwX0s5vnjvODXuNh' }, { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1hNdiEkeN-Rs_-IcD0Ph3QnD8YtbcdyYb' }, { name: 'الرياضيات', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1RZi8lBYtWvdfLctwnS8rDrT6nkSunNNS' }, { name: 'الموسيقى', icon: 'music_note', url: 'https://drive.google.com/uc?export=download&id=1Z067Q0cPWH27_9ptOu6LNv-mv1yP-t9T' }, { name: 'العلوم (فصل أول)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1aDL2x3iDDYNrhDj2lL9KyzKHaFPspjdb' }, { name: 'العلوم (فصل ثاني)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1fWcI0dVDKphoOWdgwgVqPXVO9NIa3wwg' }, { name: 'الدراسات الاجتماعية', icon: 'public', url: 'https://drive.google.com/uc?export=download&id=1s_83el-eE2K3u_TqHTHnF9ixh9e4EqnZ' }, { name: 'التربية المهنية (فصل أول)', icon: 'build', url: 'https://drive.google.com/uc?export=download&id=1-D5TKDomnebmR6RJF_ZAYM1FRfW4g1ca' }, { name: 'التربية المهنية (فصل ثاني)', icon: 'build', url: 'https://drive.google.com/uc?export=download&id=1YzaPg76-a82KHiiEXORYASCdVWsMiFBj' } ] },
            ]
        },
        {
            name: 'المرحلة الإعدادية',
            icon: 'history_edu',
            grades: [
                { name: 'الصف السابع', subjects: [ { name: 'اللغة العربية (فصل أول)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1Xal1Skvy2pQZonQcsTTpv0OgY24wfTLb' }, { name: 'اللغة العربية (فصل ثاني)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1jAT5TlMLgnfLy_dDlcxc0IbHnNS1XlY6' }, { name: 'الفنون', icon: 'palette', url: 'https://drive.google.com/uc?export=download&id=1x6kn0G9XlF5Z79bDNK3eReF-uyJVh7X9' }, { name: 'الديانة المسيحية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1wacKgTuPKHMzhEKVzgw49Yrm0pe1FxOC' }, { name: 'اللغة الإنكليزية (كتاب التمرين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1ypDcdSgm5zL4JBqO70ijOOpFdl6H9tlU' }, { name: 'اللغة الإنكليزية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1BoDnctYL5RbqMvX_mnzwzrVH0g7XjWez' }, { name: 'اللغة الفرنسية (كتاب التمرين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1DnfJKKud14PwQXQe-mdQQyqLKTD3RPF1' }, { name: 'اللغة الفرنسية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1PO5SKzSOJs9zwFmeP5chQiKkwmjlX5jU' }, { name: 'الجغرافية', icon: 'public', url: 'https://drive.google.com/uc?export=download&id=1uGnLs0RQk4owpjIqwH3IaFRXfsdxUGBM' }, { name: 'التاريخ', icon: 'history_edu', url: 'https://drive.google.com/uc?export=download&id=1cdk4aviMQ4ueg61W27DOeFhTXSq2yIgj' }, { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1-jLbRBOOiXpr4Kx-fuTa5NJCGuyOPfaH' }, { name: 'الرياضيات', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=18OWIAairt0q8eHpzcJSeiDc6CuKzQKj5' }, { name: 'الموسيقى', icon: 'music_note', url: 'https://drive.google.com/uc?export=download&id=1hPfFCTaKGtOlyTTzFMJ38pCmr36GA05L' }, { name: 'الفيزياء - الكيمياء', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1x3tWmZkaKabGN2LLk4mdnEDUVRdbWm1s' }, { name: 'اللغة الروسية', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1MSLzGuoI_T4kjHN3zKRqyQMD9mEi24Pg' }, { name: 'العلوم', icon: 'biotech', url: 'https://drive.google.com/uc?export=download&id=1XN7ktLEk4nhtkQQ0tUIUd5t1Un2kF5CF' }, { name: 'تكنلوجية الاتصالات', icon: 'computer', url: 'https://drive.google.com/uc?export=download&id=18e9_0WU9WafnzbZc3D-_VugPQSJai7Je' } ] },
                { name: 'الصف الثامن', subjects: [ { name: 'اللغة العربية (فصل أول)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1Xal1Skvy2pQZonQcsTTpv0OgY24wfTLb' }, { name: 'اللغة العربية (فصل ثاني)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1jAT5TlMLgnfLy_dDlcxc0IbHnNS1XlY6' }, { name: 'الفنون', icon: 'palette', url: 'https://drive.google.com/uc?export=download&id=1x6kn0G9XlF5Z79bDNK3eReF-uyJVh7X9' }, { name: 'الديانة المسيحية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1wacKgTuPKHMzhEKVzgw49Yrm0pe1FxOC' }, { name: 'اللغة الإنكليزية (كتاب التمرين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1ypDcdSgm5zL4JBqO70ijOOpFdl6H9tlU' }, { name: 'اللغة الإنكليزية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1BoDnctYL5RbqMvX_mnzwzrVH0g7XjWez' }, { name: 'اللغة الفرنسية (كتاب التمرين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1DnfJKKud14PwQXQe-mdQQyqLKTD3RPF1' }, { name: 'اللغة الفرنسية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1PO5SKzSOJs9zwFmeP5chQiKkwmjlX5jU' }, { name: 'الجغرافية', icon: 'public', url: 'https://drive.google.com/uc?export=download&id=1uGnLs0RQk4owpjIqwH3IaFRXfsdxUGBM' }, { name: 'التاريخ', icon: 'history_edu', url: 'https://drive.google.com/uc?export=download&id=1cdk4aviMQ4ueg61W27DOeFhTXSq2yIgj' }, { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1-jLbRBOOiXpr4Kx-fuTa5NJCGuyOPfaH' }, { name: 'الرياضيات', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=18OWIAairt0q8eHpzcJSeiDc6CuKzQKj5' }, { name: 'الموسيقى', icon: 'music_note', url: 'https://drive.google.com/uc?export=download&id=1hPfFCTaKGtOlyTTzFMJ38pCmr36GA05L' }, { name: 'الفيزياء - الكيمياء', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1x3tWmZkaKabGN2LLk4mdnEDUVRdbWm1s' }, { name: 'اللغة الروسية', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1MSLzGuoI_T4kjHN3zKRqyQMD9mEi24Pg' }, { name: 'العلوم', icon: 'biotech', url: 'https://drive.google.com/uc?export=download&id=1XN7ktLEk4nhtkQQ0tUIUd5t1Un2kF5CF' }, { name: 'تكنلوجية الاتصالات', icon: 'computer', url: 'https://drive.google.com/uc?export=download&id=18e9_0WU9WafnzbZc3D-_VugPQSJai7Je' } ] },
                { name: 'الصف التاسع', subjects: [ { name: 'الجبر', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1Q_u-zOh06EW4fdIbmugdJNhtzEs18MLP' }, { name: 'اللغة العربية', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1kYcaoNIOcs41rHa25isIn8efflvKjE0f' }, { name: 'الفنون', icon: 'palette', url: 'https://drive.google.com/uc?export=download&id=1K1FEbBloCfsZz1Xi3XoYIPR6ANCXRSxl' }, { name: 'الديانة المسيحية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1qg6QMhAnm2pdGXqhbrjQi8YIoAz6_4oJ' }, { name: 'اللغة الإنكليزية (كتاب التمارين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1ntZry3lT48SnVZR5YnbBbkxFSPQDj40C' }, { name: 'اللغة الإنكليزية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1_Mko_BK3N7_rBsD2wckbybKv1UEsT1NJ' }, { name: 'اللغة الفرنسية (كتاب التمارين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1m3m-rhhzJ2ozhuUpv8b0Fs7YnQ11otvL' }, { name: 'اللغة الفرنسية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1_jKc0jKHXqhuBdsfplspgg6SslKzzLWP' }, { name: 'الجغرافية', icon: 'public', url: 'https://drive.google.com/uc?export=download&id=1Bwgdk_WkKp0mZtsRQ5a6Y5YXPlkF2Cck' }, { name: 'الرياضيات (هندسة)', icon: 'architecture', url: 'https://drive.google.com/uc?export=download&id=1fVY2PtoyXfkl4mtvQLv8zg7lO0rc6mKL' }, { name: 'التاريخ', icon: 'history_edu', url: 'https://drive.google.com/uc?export=download&id=1GT6iuso9gxoKMqd9zw8eju8dn9sQnMcF' }, { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1C76lDr5sEm4ai7kioWlV6JScqPoSij5O' }, { name: 'الموسيقى', icon: 'music_note', url: 'https://drive.google.com/uc?export=download&id=1TeKAMGWpKw2OOOkQLeRBECmTsJ7ahZFW' }, { name: 'فيزياء - كيمياء', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1dDJeOS8Q2wjIrfJOt1P81wVH9gSMZvHC' }, { name: 'اللغة الروسية', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1L09BcmUWfc_RQ4kZmPTy8Dl51QvrzqWk' }, { name: 'العلوم', icon: 'biotech', url: 'https://drive.google.com/uc?export=download&id=1NtpmiZldf1X8pVMu3Ld5Uz8JuBp6zsU6' }, { name: 'تكنلوجية الاتصالات', icon: 'computer', url: 'https://drive.google.com/uc?export=download&id=18_4pXCrhJjmivZoNNEguRujdMeAx0_4G' } ] },
            ]
        },
        {
            name: 'المرحلة الثانوية',
            icon: 'school',
            grades: [
                { name: 'العاشر العلمي', subjects: [
                    { name: 'الرياضيات الجزء الأول', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=10_82GlLfcQ-EHAIEvdWg1IXZ9BRCdrsZ' },
                    { name: 'الرياضيات الجزء الثاني', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1A2_q9xm9dkkm-8alfCUidYQ_aCiwUjJz' },
                    { name: 'الفيزياء - علمي', icon: 'bolt', url: 'https://drive.google.com/uc?export=download&id=1vh5dtezCKhTfc0bDu1J7Fcn7BWAkjmRA' },
                    { name: 'الكيمياء - علمي', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1h5BOxXV2mhu-0Jwypc2wTE63emAJCYi3' },
                    { name: 'العلوم - علمي', icon: 'biotech', url: 'https://drive.google.com/uc?export=download&id=1dWZMUVxG6fKFLmvRK1KASsvEhYRE6F9r' },
                    { name: 'اللغة العربية - علمي', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=141fpcrgU0guzmn24MCPVaxnTT5wourjB' },
                    { name: 'اللغة الإنكليزية (الكتاب الرسمي - علمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1KISujZ1KdKK3qod6KL2t0AwMw02VVMVY' },
                    { name: 'اللغة الإنكليزية (كتاب التمارين - علمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1FFjrCzNM0mDu8DaOsU6mHPPLLXswFZ3Z' },
                    { name: 'اللغة الفرنسية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1jpeds70ImcvbEFxe9c_6nO4t91mydQIu' },
                    { name: 'اللغة الفرنسية (كتاب التمارين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=107PjXxgmDF57IBCzBwFq2aqlarmtJ6iH' },
                    { name: 'الفلسفة - علمي', icon: 'psychology', url: 'https://drive.google.com/uc?export=download&id=1YF8yWNovF6Daefp5NjbvBFUiorBgCCED' },
                    { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1rno285TDnTJwA9gxAulTIRay_gbSWUHb' },
                    { name: 'اللغة الروسية', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1rHXJks-PPknqRpzsr8P3LhSeUr9PEU9m' },
                    { name: 'تكنلوجية الاتصالات', icon: 'computer', url: 'https://drive.google.com/uc?export=download&id=1kBKcrx6nyB0OqXOSNyXFfkKGRWMq3fvs' }
                ] },
                { name: 'العاشر الأدبي', subjects: [
                    { name: 'الرياضيات - الجبر', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1JtkzV7CjGAD2yrJ_oE0no41C_7Pbcfwk'},
                    { name: 'اللغة الإنكليزية (كتاب التمارين - أدبي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1VH_ZdrbnY9L_Q8SXZJXsiF6SjGbD_dCl' },
                    { name: 'اللغة الإنكليزية (الكتاب الرسمي - أدبي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1uvPbBRLfOlWI2zuP5g5-q0YogyS0GImO' },
                    { name: 'اللغة الفرنسية (كتاب التمارين)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=107PjXxgmDF57IBCzBwFq2aqlarmtJ6iH' },
                    { name: 'اللغة الفرنسية (الكتاب الرسمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1jpeds70ImcvbEFxe9c_6nO4t91mydQIu' },
                    { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1rno285TDnTJwA9gxAulTIRay_gbSWUHb' },
                    { name: 'الكيمياء - أدبي', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1QLGZLJk8dqKxdLt5z650Q9-hcEqJGP60' },
                    { name: 'التاريخ - أدبي', icon: 'history_edu', url: 'https://drive.google.com/uc?export=download&id=1bceqqbou5B_eY_2myAyrqp5N0XValJoG' },
                    { name: 'الفلسفة - أدبي', icon: 'psychology', url: 'https://drive.google.com/uc?export=download&id=1GK-AKZLgcMbvVKeaJ_ttOMPoUdd6WHhD' },
                    { name: 'العلوم - أدبي', icon: 'biotech', url: 'https://drive.google.com/uc?export=download&id=1aaW2UDi5w6EGv4OHAHTzTr4dSh-v_d7m' },
                    { name: 'اللغة الروسية', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1rHXJks-PPknqRpzsr8P3LhSeUr9PEU9m' },
                    { name: 'تكنلوجية الاتصالات', icon: 'computer', url: 'https://drive.google.com/uc?export=download&id=1kBKcrx6nyB0OqXOSNyXFfkKGRWMq3fvs' }
                ] },
                { name: 'الحادي عشر العلمي', subjects: [
                    { name: 'الرياضيات الجزء الأول', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=10_82GlLfcQ-EHAIEvdWg1IXZ9BRCdrsZ' },
                    { name: 'الرياضيات الجزء الثاني', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1A2_q9xm9dkkm-8alfCUidYQ_aCiwUjJz' },
                    { name: 'الفيزياء (علمي)', icon: 'bolt', url: 'https://drive.google.com/uc?export=download&id=1vh5dtezCKhTfc0bDu1J7Fcn7BWAkjmRA' },
                    { name: 'الكيمياء (علمي)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1h5BOxXV2mhu-0Jwypc2wTE63emAJCYi3' },
                    { name: 'العلوم (علمي)', icon: 'biotech', url: 'https://drive.google.com/uc?export=download&id=1dWZMUVxG6fKFLmvRK1KASsvEhYRE6F9r' },
                    { name: 'اللغة العربية (علمي)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=141fpcrgU0guzmn24MCPVaxnTT5wourjB' },
                    { name: 'اللغة الإنكليزية الكتاب الرسمي (علمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1KISujZ1KdKK3qod6KL2t0AwMw02VVMVY' },
                    { name: 'اللغة الإنكليزية كتاب التمارين (علمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1FFjrCzNM0mDu8DaOsU6mHPPLLXswFZ3Z' },
                    { name: 'اللغة الفرنسية الكتاب الرسمي', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1jpeds70ImcvbEFxe9c_6nO4t91mydQIu' },
                    { name: 'اللغة الفرنسية كتاب التمارين', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=107PjXxgmDF57IBCzBwFq2aqlarmtJ6iH' },
                    { name: 'الفلسفة (علمي)', icon: 'psychology', url: 'https://drive.google.com/uc?export=download&id=1YF8yWNovF6Daefp5NjbvBFUiorBgCCED' },
                    { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1rno285TDnTJwA9gxAulTIRay_gbSWUHb' },
                    { name: 'اللغة الروسية', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1rHXJks-PPknqRpzsr8P3LhSeUr9PEU9m' },
                    { name: 'تكنولوجيا الاتصالات', icon: 'computer', url: 'https://drive.google.com/uc?export=download&id=1kBKcrx6nyB0OqXOSNyXFfkKGRWMq3fvs' }
                ] },
                { name: 'الحادي عشر الأدبي', subjects: [
                    { name: 'الرياضيات – الجبر', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1JtkzV7CjGAD2yrJ_oE0no41C_7Pbcfwk' },
                    { name: 'اللغة الإنكليزية كتاب التمارين (أدبي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1VH_ZdrbnY9L_Q8SXZJXsiF6SjGbD_dCl' },
                    { name: 'اللغة الإنكليزية الكتاب الرسمي (أدبي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1uvPbBRLfOlWI2zuP5g5-q0YogyS0GImO' },
                    { name: 'اللغة الفرنسية كتاب التمارين', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=107PjXxgmDF57IBCzBwFq2aqlarmtJ6iH' },
                    { name: 'اللغة الفرنسية الكتاب الرسمي', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1jpeds70ImcvbEFxe9c_6nO4t91mydQIu' },
                    { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1rno285TDnTJwA9gxAulTIRay_gbSWUHb' },
                    { name: 'الكيمياء (أدبي)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1QLGZLJk8dqKxdLt5z650Q9-hcEqJGP60' },
                    { name: 'التاريخ (أدبي)', icon: 'history_edu', url: 'https://drive.google.com/uc?export=download&id=1bceqqbou5B_eY_2myAyrqp5N0XValJoG' },
                    { name: 'الفلسفة (أدبي)', icon: 'psychology', url: 'https://drive.google.com/uc?export=download&id=1GK-AKZLgcMbvVKeaJ_ttOMPoUdd6WHhD' },
                    { name: 'العلوم (أدبي)', icon: 'biotech', url: 'https://drive.google.com/uc?export=download&id=1aaW2UDi5w6EGv4OHAHTzTr4dSh-v_d7m' },
                    { name: 'اللغة الروسية', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1rHXJks-PPknqRpzsr8P3LhSeUr9PEU9m' },
                    { name: 'تكنولوجيا الاتصالات', icon: 'computer', url: 'https://drive.google.com/uc?export=download&id=1kBKcrx6nyB0OqXOSNyXFfkKGRWMq3fvs' }
                ] },
                { name: 'البكالوريا العلمي', subjects: [
                    { name: 'الرياضيات – الجزء الأول', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1g8stH3uLRiSW7a-4Omoir7kIhG0LzslV' },
                    { name: 'الرياضيات – الجزء الثاني', icon: 'calculate', url: 'https://drive.google.com/uc?export=download&id=1gOCVKw0M86W33kwie5q4XfPzI7bqP04f' },
                    { name: 'الفيزياء (علمي)', icon: 'bolt', url: 'https://drive.google.com/uc?export=download&id=1erPcYAQid346vQA-XdasuaiHILz_PVu9' },
                    { name: 'الكيمياء (علمي)', icon: 'science', url: 'https://drive.google.com/uc?export=download&id=1yOB2ts80WewD7ZMzfB6YQIkfSo-E9jWK' },
                    { name: 'العلوم (علمي)', icon: 'biotech', url: 'https://drive.google.com/uc?export=download&id=19KOnpbCmhztTX1cU85QAiU4kyLcXd5Gq' },
                    { name: 'اللغة العربية (علمي)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=1ZKc_xF7ePQTcrKHXp0KTxLL9dmGoZiQA' },
                    { name: 'اللغة الإنكليزية الكتاب الرسمي (علمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1ngw0V9z4K-U0ciLnXsygVgWAgJGYqobE' },
                    { name: 'اللغة الإنكليزية كتاب التمارين (علمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1KzmNwEXkWQ6D17xs7iznNduVcOxF1Cu7' },
                    { name: 'اللغة الفرنسية كتاب التمارين', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1NZG3g6giqFb2Vy6IZGVrvFqJwdcpvs49' },
                    { name: 'اللغة الروسية (علمي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1gBpxOQ6Bh3xmjPNu42qnHy0q3LrxdMFv' },
                    { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1h1KsJ0tumVD2EGyDUoHoFq6RvxMygfTu' },
                    { name: 'الديانة المسيحية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1Aqnh37Q2qsPiq75Q_T8EFaHk_nnV5EoW' }
                ] },
                { name: 'البكالوريا الأدبي', subjects: [
                    { name: 'الفلسفة (أدبي) – الفصل الأول', icon: 'psychology', url: 'https://drive.google.com/uc?export=download&id=1Iip2B92OkTNh7hywWGy4oi4_LZK2eUz-' },
                    { name: 'الفلسفة (أدبي) – الفصل الثاني', icon: 'psychology', url: 'https://drive.google.com/uc?export=download&id=1G7ciDsP1LqkrrabngYPBetQUZSaBR8Nq' },
                    { name: 'التاريخ (أدبي)', icon: 'history_edu', url: 'https://drive.google.com/uc?export=download&id=1gkhdoqbM5s2H__Xe3ZfpZKaPE0doumrm' },
                    { name: 'الجغرافية (أدبي)', icon: 'public', url: 'https://drive.google.com/uc?export=download&id=1X2lkmFiOl5Z2r96ududL1bxOuQNRJEVN' },
                    { name: 'اللغة العربية (أدبي)', icon: 'abc', url: 'https://drive.google.com/uc?export=download&id=12DeFqKPU09whaJqn9AGnbyw_xk0qHIsz' },
                    { name: 'اللغة الإنكليزية الكتاب الرسمي (أدبي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1fdwUu_AVuSR5zY8-i_I96A5ptB-YBceM' },
                    { name: 'اللغة الإنكليزية كتاب التمارين (أدبي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1Yo5Tt9udqdNyKYAfOzMYwerDKr-4SMM0' },
                    { name: 'اللغة الفرنسية (أدبي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1LnhwWm_76hNxkDGljFJhXKXbF920Fxng' },
                    { name: 'اللغة الفرنسية كتاب التمارين', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1NZG3g6giqFb2Vy6IZGVrvFqJwdcpvs49' },
                    { name: 'اللغة الروسية (أدبي)', icon: 'translate', url: 'https://drive.google.com/uc?export=download&id=1CjpRYg72dAHFQU-CReiR9NP5-6Nqbrj_' },
                    { name: 'الديانة الإسلامية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1h1KsJ0tumVD2EGyDUoHoFq6RvxMygfTu' },
                    { name: 'الديانة المسيحية', icon: 'auto_stories', url: 'https://drive.google.com/uc?export=download&id=1Aqnh37Q2qsPiq75Q_T8EFaHk_nnV5EoW' }
                ] },
            ]
        }
    ];
    
    const handleDownload = (subject: Subject) => {
        if (!selectedGrade) return;
        if (subject.url) {
            window.open(subject.url, '_blank');
        } else {
            alert(`جاري تحميل كتاب ${subject.name} لـ ${selectedGrade.name}... (هذه وظيفة تجريبية)`);
        }
    };

    const handleSelectStage = (stage: Stage) => {
        setSelectedStage(stage);
        setSelectedGrade(null);
    };
    
    const handleSelectGrade = (grade: Grade) => {
        setSelectedGrade(grade);
    };

    const handleGoBack = () => {
        if (selectedGrade) {
            setSelectedGrade(null);
        } else if (selectedStage) {
            setSelectedStage(null);
        }
    };

    const renderContent = () => {
        if (selectedGrade) {
            // Step 3: Show Subjects
            return (
                <div className="quiz-step-card">
                    <div className="quiz-step-header">
                        <span className="step-number">3</span>
                        <h3>الكتب المتاحة لـ {selectedGrade.name}</h3>
                    </div>
                    <div className="subjects-list">
                        {selectedGrade.subjects.map((subject, index) => (
                            <div key={index} className="subject-card">
                                <span className="material-icons subject-icon">{subject.icon}</span>
                                <span className="subject-name">{subject.name}</span>
                                <button onClick={() => handleDownload(subject)} className="download-btn">
                                    <span className="material-icons">download</span>
                                    تحميل
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (selectedStage) {
            // Step 2: Show Grades
            return (
                 <div className="quiz-step-card">
                    <div className="quiz-step-header">
                        <span className="step-number">2</span>
                        <h3>اختر الصف الدراسي</h3>
                    </div>
                    <div className="selection-grid">
                        {selectedStage.grades.map((grade, index) => (
                            <div key={index} className="selection-card" onClick={() => handleSelectGrade(grade)}>
                                <span className="material-icons selection-icon">school</span>
                                <h3>{grade.name}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Step 1: Show Stages
        return (
            <div className="quiz-step-card">
                <div className="quiz-step-header">
                    <span className="step-number">1</span>
                    <h3>اختر المرحلة الدراسية</h3>
                </div>
                <div className="selection-grid">
                    {stages.map((stage, index) => (
                        <div key={index} className="selection-card" onClick={() => handleSelectStage(stage)}>
                            <span className="material-icons selection-icon">{stage.icon}</span>
                            <h3>{stage.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="page books-page">
            <div className="header">
                 {selectedStage && (
                    <button onClick={handleGoBack} className="back-button" aria-label="العودة">
                        <span className="material-icons">arrow_forward</span>
                    </button>
                )}
                <h1>الكتب المدرسية</h1>
            </div>
             <p className="books-intro-message">
                هذه هي النسخ المعتمدة رسميًا من وزارة التربية السورية للعام الدراسي 2025-2026. نعمل باستمرار على إضافة أي كتب ناقصة.
            </p>
            {renderContent()}
        </div>
    );
};

// --- START of merged tools components ---

const SummarizerPage = () => {
    type SummarySize = 'قصير' | 'متوسط' | 'مفصل';
    type SummaryLevel = 'مبسط' | 'المستوى المدرسي' | 'أكاديمي';

    const [text, setText] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [result, setResult] = useState<{ summary: string | null; error: string | null }>({ summary: null, error: null });
    const [isLoading, setIsLoading] = useState(false);
    const [summarySize, setSummarySize] = useState<SummarySize>('متوسط'); // 'قصير', 'متوسط', 'مفصل'
    const [summaryLevel, setSummaryLevel] = useState<SummaryLevel>('المستوى المدرسي'); // 'مبسط', 'المستوى المدرسي', 'أكاديمي'

    // New states for added features
    const [questions, setQuestions] = useState<any[]>([]);
    const [examples, setExamples] = useState<string | null>(null);
    const [showAnswers, setShowAnswers] = useState(false);
    const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
    const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prevFiles => [...prevFiles, ...Array.from(event.target.files!)]);
            (event.target as HTMLInputElement).value = '';
        }
    };

    const removeFile = (indexToRemove: number) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const startCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = stream;
                setIsCameraOpen(true);
            } catch (err) {
                console.error("Error accessing camera: ", err);
                alert("لا يمكن الوصول إلى الكاميرا. يرجى التحقق من الأذونات.");
            }
        }
    };

    useEffect(() => {
        if (isCameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
        streamRef.current = null;
    };

    const captureFrame = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (!context) return;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob(blob => {
                if(blob) {
                    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setFiles(prevFiles => [...prevFiles, file]);
                }
                stopCamera();
            }, 'image/jpeg');
        }
    };

    const handleSummarize = async () => {
        if (files.length === 0 && !text.trim()) return;
        setIsLoading(true);
        setResult({ summary: null, error: null });
        setQuestions([]);
        setExamples(null);
        setShowAnswers(false);
        setUserAnswers({});
    
        try {
            const sizeMapping: Record<SummarySize, string> = {
                'قصير': 'short, a few sentences',
                'متوسط': 'medium, a paragraph or two',
                'مفصل': 'detailed, multiple paragraphs'
            };
    
            const levelMapping: Record<SummaryLevel, string> = {
                'مبسط': 'in a simple style, easy for a child to understand',
                'المستوى المدرسي': 'at a high school student level',
                'أكاديمي': 'in a formal, academic style for a university student'
            };
            
            const userInstruction = text.trim() || 'لخص الملفات المرفقة.';
            const detailedPrompt = `
                بناءً على المحتوى المقدم (نص و/أو ملفات) وتعليمات المستخدم، قم بإنشاء ملخص باللغة العربية.
                يجب أن تكون استجابتك كائن JSON واحد فقط يحتوي على مفتاح واحد هو "summary".
    
                تعليمات المستخدم: "${userInstruction}"
                
                قيود الملخص:
                - الطول: ${sizeMapping[summarySize]}
                - المستوى: ${levelMapping[summaryLevel]}
            `;
            
            const messageParts: any[] = [{ text: detailedPrompt }];

            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    const base64Data = await fileToBase64(file);
                    messageParts.push({
                        inlineData: { mimeType: file.type, data: base64Data },
                    });
                }
            }
    
            const proxyResponse = await fetch('/.netlify/functions/gemini-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemini-2.5-flash',
                    contents: [{ parts: messageParts }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                summary: { type: Type.STRING }
                            },
                        },
                    },
                })
            });
    
            if (!proxyResponse.ok) {
                throw new Error("Proxy request failed.");
            }
            const response = await proxyResponse.json();
    
            let summaryText: string | null = null;
            try {
                let jsonStr = response.text.trim();
                const parsedJson = JSON.parse(jsonStr);

                if (parsedJson && parsedJson.summary) {
                    summaryText = parsedJson.summary;
                }
            } catch (e) {
                console.warn("Could not parse JSON response from summarizer, falling back to plain text.", response.text);
                if (response.text && response.text.trim().length > 0) {
                    if (!response.text.trim().startsWith('{')) {
                       summaryText = response.text;
                    }
                }
            }

            if (summaryText) {
                setResult({ summary: summaryText, error: null });
            } else {
                throw new Error("The model returned an empty or invalid response.");
            }

        } catch (error) {
            console.error("Error summarizing:", error);
            setResult({ summary: null, error: 'عذراً، لم أتمكن من معالجة طلبك. قد يكون هناك خطأ في تنسيق الاستجابة من النموذج.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateQuestions = async () => {
        if (!result.summary) return;
        setIsGeneratingQuestions(true);
        setQuestions([]);
        setShowAnswers(false);
        setUserAnswers({});

        try {
            const promptText = `
                Based on the following text, generate 3-5 multiple-choice questions to test understanding.
                Your entire response MUST be a single JSON object with a single key "questions".
                The value for "questions" should be an array of question objects.

                Each question object must have the following properties:
                - "question": A string containing the question text.
                - "type": Always "Multiple Choice".
                - "answer": A string containing the correct answer.
                - "options": An array of 4 strings for the options. One of the options must be the correct answer.

                Please adhere strictly to this JSON format. Respond in Arabic.

                ---
                Text to analyze: "${result.summary}"
                ---
            `;
            
            const proxyResponse = await fetch('/.netlify/functions/gemini-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemini-2.5-flash',
                    contents: [{ parts: [{ text: promptText }] }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                questions: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            question: { type: Type.STRING },
                                            type: { type: Type.STRING },
                                            answer: { type: Type.STRING },
                                            options: {
                                                type: Type.ARRAY,
                                                items: { type: Type.STRING }
                                            },
                                        }
                                    }
                                }
                            }
                        },
                    },
                })
            });

            if (!proxyResponse.ok) {
                throw new Error("Proxy request failed for generating questions.");
            }

            const response = await proxyResponse.json();

            let parsedJson;
            try {
                let jsonStr = response.text.trim();
                parsedJson = JSON.parse(jsonStr);
            } catch (e) {
                console.error("Failed to parse questions JSON:", e);
                throw new Error("Failed to parse questions JSON from model response.");
            }
            setQuestions(parsedJson.questions || []);


            if (!parsedJson.questions || parsedJson.questions.length === 0) {
                 setResult(prev => ({ ...prev, error: 'لم يتمكن النموذج من إنشاء أسئلة من هذا الملخص.' }));
            }
        } catch (err) {
            console.error("Error generating questions:", err);
            setResult(prev => ({ ...prev, error: 'عذراً، حدث خطأ أثناء إنشاء الأسئلة.' }));
        } finally {
            setIsGeneratingQuestions(false);
        }
    };
    
    const handleGenerateExamples = async () => {
        if (!result.summary) return;
        setIsGeneratingExamples(true);
        setExamples(null);
        
        try {
             const promptText = `
                Based on the following summary, provide a few simple, practical examples or analogies to help explain the main concepts to a student.
                Respond directly with the examples in Arabic. Do not add any introductory or concluding phrases.

                ---
                Summary: "${result.summary}"
                ---
            `;
            
            const proxyResponse = await fetch('/.netlify/functions/gemini-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemini-2.5-flash',
                    contents: [{ parts: [{ text: promptText }] }],
                })
            });

            if (!proxyResponse.ok) throw new Error('Proxy request failed.');

            const response = await proxyResponse.json();
            setExamples(response.text);
        } catch (err) {
            console.error("Error generating examples:", err);
            setResult(prev => ({ ...prev, error: 'عذراً، حدث خطأ أثناء إنشاء الأمثلة.' }));
        } finally {
            setIsGeneratingExamples(false);
        }
    };

    const handleSelectAnswer = (questionIndex: number, option: string) => {
        if (showAnswers) return;
        setUserAnswers(prev => ({
            ...prev,
            [questionIndex]: option,
        }));
    };

    let score = 0;
    if (showAnswers && questions.length > 0) {
        questions.forEach((q, index) => {
            if (userAnswers[index] === q.answer) {
                score++;
            }
        });
    }

    const summarizerLoadingMessages = ["جاري تحليل المحتوى...", "نستخرج الأفكار الرئيسية...", "نصوغ الملخص النهائي... يرجى الانتظار"];
    const questionLoadingMessages = ["نحلل الملخص بعمق...", "نصمم أسئلة متنوعة...", "نضع الخيارات بعناية..."];
    const exampleLoadingMessages = ["نبحث عن أفضل التشبيهات...", "نصوغ أمثلة عملية ومبسطة...", "لحظات وتكون الأمثلة جاهزة..."];

    return (
        <>
            <div className="quiz-step-card">
                 <div className="quiz-step-header">
                    <span className="step-number">1</span>
                    <h3>أدخل المحتوى</h3>
                </div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="اكتب توضيحاً لما تريد من الملفات المرفقة (مثال: لخص لي هذا الكتاب)..."
                    rows={4}
                    aria-label="Instructions for summarization"
                    style={{color: 'black'}}
                ></textarea>

                {files.length > 0 && (
                    <div className="file-preview-area">
                        {files.map((file, index) => (
                            <div key={index} className={`file-preview-item ${file.type === 'application/pdf' ? 'pdf-preview' : ''}`}>
                                {file.type.startsWith('image/') ? (
                                    <img src={URL.createObjectURL(file)} alt={file.name} />
                                ) : (
                                    <>
                                        <span className="material-icons">picture_as_pdf</span>
                                        <span className="file-name">{file.name}</span>
                                    </>
                                )}
                                <button onClick={() => removeFile(index)} aria-label={`إزالة ${file.name}`}>&times;</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="summarizer-controls">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                        multiple
                        aria-hidden="true"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="control-btn">
                        <span className="material-icons">attach_file</span> إرفاق ملف
                    </button>
                    <button onClick={startCamera} className="control-btn">
                        <span className="material-icons">photo_camera</span> فتح الكاميرا
                    </button>
                </div>
            </div>

            {isCameraOpen && (
                <div className="camera-modal">
                    <div className="camera-view">
                        <video ref={videoRef} autoPlay playsInline aria-label="Camera feed"></video>
                        <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true"></canvas>
                        <div className="camera-controls">
                            <button onClick={captureFrame} className="capture-btn">التقاط صورة</button>
                            <button onClick={stopCamera} className="close-btn">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="quiz-step-card">
                <div className="quiz-step-header">
                    <span className="step-number">2</span>
                    <h3>خصص التلخيص</h3>
                </div>
                <div className="quiz-settings-grid">
                    {/* Summary Size */}
                    <div className="setting-group">
                        <label><span className="material-icons">format_size</span> حجم التلخيص</label>
                        <div className="segmented-control">
                            <button className={summarySize === 'قصير' ? 'active' : ''} onClick={() => setSummarySize('قصير')}>قصير</button>
                            <button className={summarySize === 'متوسط' ? 'active' : ''} onClick={() => setSummarySize('متوسط')}>متوسط</button>
                            <button className={summarySize === 'مفصل' ? 'active' : ''} onClick={() => setSummarySize('مفصل')}>مفصل</button>
                        </div>
                    </div>
                    {/* Summary Level */}
                    <div className="setting-group">
                        <label><span className="material-icons">school</span> مستوى التلخيص</label>
                        <div className="segmented-control">
                            <button className={summaryLevel === 'مبسط' ? 'active' : ''} onClick={() => setSummaryLevel('مبسط')}>مبسط</button>
                            <button className={summaryLevel === 'المستوى المدرسي' ? 'active' : ''} onClick={() => setSummaryLevel('المستوى المدرسي')}>المستوى المدرسي</button>
                            <button className={summaryLevel === 'أكاديمي' ? 'active' : ''} onClick={() => setSummaryLevel('أكاديمي')}>أكاديمي</button>
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={handleSummarize} disabled={isLoading || (files.length === 0 && !text.trim())} className="generate-btn">
                 <span className="material-icons">mediation</span>
                {isLoading ? 'جاري التلخيص...' : 'ابدأ التلخيص'}
            </button>

            {isLoading && <EnhancedLoader messages={summarizerLoadingMessages} />}

            {result && (
                <div className="results-container">
                    {result.error && !result.summary && <p className="error-message">{result.error}</p>}
                    
                    {result.summary && (
                        <div className="result-section">
                            <h2>الملخص</h2>
                            <p>{result.summary}</p>

                            <div className="result-actions">
                                <button onClick={handleGenerateQuestions} disabled={isGeneratingQuestions || isGeneratingExamples} className="result-action-btn">
                                    <span className="material-icons">quiz</span>
                                    {isGeneratingQuestions ? 'لحظة...' : 'إنشاء أسئلة'}
                                </button>
                                <button onClick={handleGenerateExamples} disabled={isGeneratingQuestions || isGeneratingExamples} className="result-action-btn">
                                    <span className="material-icons">lightbulb</span>
                                    {isGeneratingExamples ? 'لحظة...' : 'إنشاء أمثلة'}
                                </button>
                            </div>
                        </div>
                    )}

                    {isGeneratingQuestions && <EnhancedLoader messages={questionLoadingMessages} />}
                    
                    {questions.length > 0 && (
                        <div className={`questions-container summarizer-questions ${showAnswers ? 'answers-shown' : ''}`}>
                            <h2>أسئلة من الملخص</h2>

                            {showAnswers && (
                                <div className="quiz-score-container">
                                    <h3>النتيجة: {score} / {questions.length}</h3>
                                </div>
                            )}

                            {questions.map((q, index) => (
                                <div key={index} className="question-card">
                                    <p className="question-text"><strong>{index + 1}. </strong>{q.question}</p>
                                    {q.options && (
                                        <ul className="options-list">
                                            {q.options.map((option: string, i: number) => {
                                                const isSelected = userAnswers[index] === option;
                                                const isCorrect = q.answer === option;
                                                let className = '';
                                                if (showAnswers) {
                                                    if (isCorrect) {
                                                        className = 'correct';
                                                    } else if (isSelected && !isCorrect) {
                                                        className = 'incorrect';
                                                    }
                                                } else if (isSelected) {
                                                    className = 'selected';
                                                }

                                                return (
                                                    <li
                                                        key={i}
                                                        className={className}
                                                        onClick={() => handleSelectAnswer(index, option)}
                                                    >
                                                        {option}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            ))}
                            {!showAnswers && (
                                <button onClick={() => setShowAnswers(true)} className="reveal-answers-btn">
                                     <span className="material-icons">visibility</span>
                                    إظهار الحل
                                </button>
                            )}
                        </div>
                    )}
                    
                    {isGeneratingExamples && <EnhancedLoader messages={exampleLoadingMessages} />}

                    {examples && (
                         <div className="result-section">
                            <h2>أمثلة توضيحية</h2>
                             <MarkdownRenderer text={examples} />
                        </div>
                    )}

                </div>
            )}
        </>
    );
};

// --- Text to Speech Page Component ---
const TextToSpeechPage = () => {
    const [text, setText] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [voice, setVoice] = useState('Kore'); // Kore: Female, Puck: Male
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [audioData, setAudioData] = useState<string | null>(null);

    // Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const playbackStartTimeRef = useRef(0);
    const pausedAtTimeRef = useRef(0);

    // Audio Decoding Helpers
    const decodeB64 = (base64: string) => {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };

    const decodePcm = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    };

    // File & Camera handling (reused from Summarizer)
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prevFiles => [...prevFiles, ...Array.from(event.target.files!)]);
            (event.target as HTMLInputElement).value = '';
        }
    };

    const removeFile = (indexToRemove: number) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const startCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = stream;
                setIsCameraOpen(true);
            } catch (err) {
                console.error("Error accessing camera: ", err);
                alert("لا يمكن الوصول إلى الكاميرا. يرجى التحقق من الأذونات.");
            }
        }
    };
    
    useEffect(() => {
        if (isCameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);


    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
        streamRef.current = null;
    };

    const captureFrame = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (!context) return;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                if(blob) {
                    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setFiles(prevFiles => [...prevFiles, file]);
                }
                stopCamera();
            }, 'image/jpeg');
        }
    };
    
     // Reset player when audio data changes
    useEffect(() => {
        const setupAudio = async () => {
            if (audioData) {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const audioBytes = decodeB64(audioData);
                const buffer = await decodePcm(audioBytes, audioContextRef.current, 24000, 1);
                audioBufferRef.current = buffer;
                setDuration(buffer.duration);
            }
        };
        setupAudio();
    }, [audioData]);

    const stopPlayback = () => {
        if (audioSourceRef.current) {
            audioSourceRef.current.onended = null;
            audioSourceRef.current.stop();
            audioSourceRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setIsPlaying(false);
    };

    const updateProgress = () => {
        if (isPlaying && audioContextRef.current) {
            const elapsedTime = audioContextRef.current.currentTime - playbackStartTimeRef.current + pausedAtTimeRef.current;
            const newProgress = (elapsedTime / duration) * 100;
            setCurrentTime(elapsedTime);
            setProgress(newProgress > 100 ? 100 : newProgress);
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
    };

    const togglePlayPause = () => {
        if (!audioContextRef.current || !audioBufferRef.current) return;

        if (isPlaying) {
            pausedAtTimeRef.current += audioContextRef.current.currentTime - playbackStartTimeRef.current;
            stopPlayback();
        } else {
            audioSourceRef.current = audioContextRef.current.createBufferSource();
            audioSourceRef.current.buffer = audioBufferRef.current;
            audioSourceRef.current.connect(audioContextRef.current.destination);

            audioSourceRef.current.onended = () => {
                if (currentTime >= duration - 0.1) { // Handle natural end
                    pausedAtTimeRef.current = 0;
                    setCurrentTime(0);
                    setProgress(0);
                }
                stopPlayback();
            };

            const offset = pausedAtTimeRef.current % duration;
            audioSourceRef.current.start(0, offset);
            playbackStartTimeRef.current = audioContextRef.current.currentTime;
            setIsPlaying(true);
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
    };
    
    const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioBufferRef.current || !audioContextRef.current) return;
        
        const newProgress = parseFloat(event.target.value);
        setProgress(newProgress);
        
        const newTime = (newProgress / 100) * duration;
        pausedAtTimeRef.current = newTime;
        setCurrentTime(newTime);
        
        if (isPlaying) {
            stopPlayback();
            // Wait a tick then play again to apply seek
            setTimeout(togglePlayPause, 0);
        }
    };

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const handleGenerateAudio = async () => {
        if (files.length === 0 && !text.trim()) {
            setError('الرجاء إدخال نص أو إرفاق صورة.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAudioData(null);
        stopPlayback();
        setCurrentTime(0);
        setProgress(0);
        pausedAtTimeRef.current = 0;

        try {
            let combinedText = text.trim();

            if (files.length > 0) {
                const imageParts = await Promise.all(files.map(async (file) => {
                    const base64Data = await fileToBase64(file);
                    return { inlineData: { mimeType: file.type, data: base64Data } };
                }));

                const prompt = `استخرج كل النص من الصورة/الصور المرفقة. أجب بالنص المستخرج فقط.`;
                
                const textProxyResponse = await fetch('/.netlify/functions/gemini-proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'gemini-2.5-flash',
                        contents: [{ parts: [{ text: prompt }, ...imageParts] }],
                    })
                });

                if (!textProxyResponse.ok) {
                    throw new Error('Failed to extract text from images via proxy.');
                }

                const textResponse = await textProxyResponse.json();
                
                if (textResponse.text) {
                    combinedText = `${combinedText}\n\n${textResponse.text}`.trim();
                }
            }

            if (!combinedText) {
                setError('لم يتم العثور على نص. الرجاء المحاولة مرة أخرى.');
                setIsLoading(false);
                return;
            }

            const ttsProxyResponse = await fetch('/.netlify/functions/tts-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: combinedText,
                    voice: voice || 'Kore'
                })
            });

            if (!ttsProxyResponse.ok) {
                throw new Error('TTS proxy request failed.');
            }

            const ttsResponseData = await ttsProxyResponse.json();
            const audioContent = ttsResponseData.audioContent;

            if (audioContent) {
                setAudioData(audioContent);
            } else {
                throw new Error('لم يتم استلام محتوى صوتي.');
            }

        } catch (err) {
            console.error("Error generating audio:", err);
            setError(`حدث خطأ: ${(err as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!audioBufferRef.current || !(window as any).lamejs) {
            setError("مكتبة التشفير أو بيانات الصوت غير متاحة.");
            return;
        }

        const lame = (window as any).lamejs;
        const mp3encoder = new lame.Mp3Encoder(1, audioBufferRef.current.sampleRate, 128); // 1 channel, 24k sample rate, 128 kbps
        const samples = audioBufferRef.current.getChannelData(0);
        const sampleBlockSize = 1152;
        const mp3Data = [];

        // Convert Float32 to Int16
        const int16Samples = new Int16Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            int16Samples[i] = samples[i] * 32767;
        }

        for (let i = 0; i < int16Samples.length; i += sampleBlockSize) {
            const sampleChunk = int16Samples.subarray(i, i + sampleBlockSize);
            const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
            if (mp3buf.length > 0) {
                mp3Data.push(new Int8Array(mp3buf));
            }
        }
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(new Int8Array(mp3buf));
        }

        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'audio.mp3';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const ttsLoadingMessages = ["نعالج النص المطلوب...", "نختار نبرة الصوت المناسبة...", "نحول الكلمات إلى موجات صوتية..."];

    return (
        <>
            <div className="quiz-step-card">
                 <div className="quiz-step-header">
                    <span className="step-number">1</span>
                    <h3>أدخل المحتوى</h3>
                </div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="اكتب النص الذي تريد تحويله إلى صوت هنا..."
                    rows={7}
                    aria-label="Text to convert to speech"
                ></textarea>

                {files.length > 0 && (
                    <div className="file-preview-area">
                        {files.map((file, index) => (
                            <div key={index} className="file-preview-item">
                                <img src={URL.createObjectURL(file)} alt={file.name} />
                                <button onClick={() => removeFile(index)} aria-label={`إزالة ${file.name}`}>&times;</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="summarizer-controls">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                        multiple
                        aria-hidden="true"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="control-btn">
                        <span className="material-icons">attach_file</span> إرفاق صورة
                    </button>
                    <button onClick={startCamera} className="control-btn">
                        <span className="material-icons">photo_camera</span> فتح الكاميرا
                    </button>
                </div>
            </div>

            {isCameraOpen && (
                <div className="camera-modal">
                    <div className="camera-view">
                        <video ref={videoRef} autoPlay playsInline aria-label="Camera feed"></video>
                        <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true"></canvas>
                        <div className="camera-controls">
                            <button onClick={captureFrame} className="capture-btn">التقاط</button>
                            <button onClick={stopCamera} className="close-btn">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="quiz-step-card">
                <div className="quiz-step-header">
                    <span className="step-number">2</span>
                    <h3>اختر الصوت</h3>
                </div>
                <div className="voice-selector">
                    <button className={`voice-option ${voice === 'Kore' ? 'active' : ''}`} onClick={() => setVoice('Kore')}>
                        <span className="material-icons">female</span> أنثى
                    </button>
                    <button className={`voice-option ${voice === 'Puck' ? 'active' : ''}`} onClick={() => setVoice('Puck')}>
                        <span className="material-icons">male</span> ذكر
                    </button>
                </div>
            </div>
            
             <button onClick={handleGenerateAudio} disabled={isLoading || (!text.trim() && files.length === 0)} className="generate-btn">
                 <span className="material-icons">volume_up</span>
                {isLoading ? 'جاري إنشاء الصوت...' : 'إنشاء الصوت'}
            </button>
            
            {isLoading && <EnhancedLoader messages={ttsLoadingMessages} />}
            {error && <p className="error-message">{error}</p>}
            
            {audioData && (
                 <div className="tts-results">
                    <div className="audio-player-container">
                        <div className="player-controls">
                            <button onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
                                <span className="material-icons">{isPlaying ? 'pause' : 'play_arrow'}</span>
                            </button>
                        </div>
                        <div className="progress-container">
                            <span className="time-display current">{formatTime(currentTime)}</span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={handleSeek}
                                className="progress-bar"
                                style={{ '--progress-percent': `${progress}%` } as React.CSSProperties}
                                aria-label="Audio progress"
                            />
                            <span className="time-display duration">{formatTime(duration)}</span>
                        </div>
                    </div>
                    <div className="tts-download-container">
                        <button onClick={handleDownload} className="download-btn">
                            <span className="material-icons">download</span>
                            تحميل MP3
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

// --- Quiz Builder Page Component ---
const QuizBuilderPage = () => {
    const [topic, setTopic] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [questionType, setQuestionType] = useState('Multiple Choice');
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState('Medium');
    const [questions, setQuestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAnswers, setShowAnswers] = useState(false);
    const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationResults, setEvaluationResults] = useState<{ [key: number]: { score: number; feedback: string } }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prevFiles => [...prevFiles, ...Array.from(event.target.files!)]);
            (event.target as HTMLInputElement).value = ''; // Allow re-selecting the same file
        }
    };

    const removeFile = (indexToRemove: number) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const handleGenerateQuestions = async () => {
        if (!topic.trim() && files.length === 0) return;
        setIsLoading(true);
        setQuestions([]);
        setError('');
        setShowAnswers(false);
        setUserAnswers({});
        setEvaluationResults({});

        try {
            const messageParts: any[] = [];
            
            const userInstruction = topic.trim() || `Generate questions based on the attached files.`;

            const promptText = `
                Based on the following topic/files and constraints, generate a set of exam questions.
                Your entire response MUST be a single JSON object with a single key "questions".
                The value for "questions" should be an array of question objects.

                Each question object must have the following properties:
                - "question": A string containing the question text.
                - "type": A string indicating the question type ("Multiple Choice", "True/False", or "Short Answer").
                - "answer": A string containing the correct answer. For True/False questions, the answer must be either "صح" or "خطأ".
                - "options": An array of strings for "Multiple Choice" questions. This property should only exist for multiple-choice questions. One of the options must be the correct answer.

                Please adhere strictly to this JSON format. Respond in Arabic.

                ---
                Topic/Instructions: "${userInstruction}"
                Question Type: "${questionType}"
                Number of Questions: ${numQuestions}
                Difficulty Level: "${difficulty}"
                ---
            `;
            
            messageParts.push({ text: promptText });

            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    const base64Data = await fileToBase64(file);
                    messageParts.push({
                        inlineData: { mimeType: file.type, data: base64Data },
                    });
                }
            }

            const proxyResponse = await fetch('/.netlify/functions/gemini-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemini-2.5-flash',
                    contents: [{ parts: messageParts }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                questions: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            question: { type: Type.STRING },
                                            type: { type: Type.STRING },
                                            answer: { type: Type.STRING },
                                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        }
                                    }
                                }
                            }
                        },
                    },
                })
            });

            if (!proxyResponse.ok) {
                throw new Error("Proxy request failed.");
            }
            const response = await proxyResponse.json();

            let parsedJson;
            try {
                let jsonStr = response.text.trim();
                parsedJson = JSON.parse(jsonStr);
            } catch(e) {
                console.error("Failed to parse quiz JSON:", e);
                throw new Error("Failed to parse quiz JSON from model response.");
            }
            setQuestions(parsedJson.questions || []);

            if (!parsedJson.questions || parsedJson.questions.length === 0) {
                setError('لم يتمكن النموذج من إنشاء أسئلة. حاول مرة أخرى بموضوع مختلف.');
            }
        } catch (err) {
            console.error("Error generating questions:", err);
            setError('عذراً، حدث خطأ أثناء إنشاء الأسئلة. يرجى التحقق من تنسيق استجابة النموذج.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAnswer = (questionIndex: number, answer: string) => {
        if (showAnswers) return;
        setUserAnswers(prev => ({
            ...prev,
            [questionIndex]: answer,
        }));
    };

    const handleShowAnswers = async () => {
        setShowAnswers(true);
    
        const shortAnswerQuestionsToEvaluate = questions
            .map((q, index) => ({ ...q, index }))
            .filter(q => q.type === 'Short Answer' && userAnswers[q.index]?.trim());
    
        if (shortAnswerQuestionsToEvaluate.length === 0) {
            return;
        }
    
        setIsEvaluating(true);
        setEvaluationResults({});
    
        try {
            const evaluationPromises = shortAnswerQuestionsToEvaluate.map(q => {
                const prompt = `
                    You are an AI assistant evaluating a student's answer.
                    The question was: "${q.question}"
                    The model's correct answer is: "${q.answer}"
                    The student's answer is: "${userAnswers[q.index]}"
    
                    Please evaluate how correct the student's answer is compared to the model's answer.
                    Your response MUST be a single JSON object with two keys:
                    1. "score": an integer from 1 to 10, where 1 is completely wrong and 10 is perfectly correct.
                    2. "feedback": a short, one-sentence explanation in Arabic for the score you gave.
    
                    Adhere strictly to this JSON format.
                `;
                return fetch('/.netlify/functions/gemini-proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'gemini-2.5-flash',
                        contents: [{ parts: [{ text: prompt }] }],
                        config: { 
                            responseMimeType: "application/json",
                            responseSchema: {
                                type: Type.OBJECT,
                                properties: {
                                    score: { type: Type.INTEGER },
                                    feedback: { type: Type.STRING },
                                }
                            }
                        },
                    })
                }).then(res => res.json()).then(response => {
                    try {
                        let jsonStr = response.text.trim();
                        const result = JSON.parse(jsonStr);
                        return { index: q.index, ...result };
                    } catch (e) {
                        console.error("Failed to parse evaluation response for question index", q.index, response.text);
                        return { index: q.index, score: 0, feedback: "خطأ في تقييم الإجابة." };
                    }
                });
            });
    
            const results = await Promise.all(evaluationPromises);
    
            const newEvaluationResults: { [key: number]: { score: number; feedback: string } } = {};
            results.forEach(result => {
                newEvaluationResults[result.index] = { score: result.score, feedback: result.feedback };
            });
    
            setEvaluationResults(newEvaluationResults);
    
        } catch (err) {
            console.error("Error evaluating answers:", err);
            setError("حدث خطأ أثناء تقييم الإجابات.");
        } finally {
            setIsEvaluating(false);
        }
    };

    let score = 0;
    if (showAnswers && questions.length > 0) {
        questions.forEach((q, index) => {
            if (q.type !== 'Short Answer' && userAnswers[index] === q.answer) {
                score++;
            }
        });
    }

    const shortAnswerCount = questions.filter(q => q.type === 'Short Answer').length;
    const scoredQuestionCount = questions.length - shortAnswerCount;
    const quizLoadingMessages = ["نفهم الموضوع الذي أدخلته...", "نصمم أسئلة تتناسب مع المستوى المطلوب...", "نجهز لك اختباراً شاملاً..."];

    return (
        <>
            {/* Step 1: Provide Content */}
            <div className="quiz-step-card">
                <div className="quiz-step-header">
                    <span className="step-number">1</span>
                    <h3>أدخل المحتوى</h3>
                </div>
                <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="اكتب النص أو الموضوع هنا..."
                    rows={5}
                    aria-label="Topic for questions"
                    style={{color: 'black'}}
                ></textarea>
                
                <div className="file-upload-area">
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                        multiple
                        aria-hidden="true"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="file-upload-btn">
                        <span className="material-icons">upload_file</span>
                        <span>إرفاق ملف (صورة)</span>
                    </button>
                </div>

                {files.length > 0 && (
                    <div className="file-preview-area">
                        {files.map((file, index) => (
                            <div key={index} className={`file-preview-item ${file.type === 'application/pdf' ? 'pdf-preview' : ''}`}>
                                {file.type.startsWith('image/') ? (
                                    <img src={URL.createObjectURL(file)} alt={file.name} />
                                ) : (
                                    <>
                                        <span className="material-icons">picture_as_pdf</span>
                                        <span className="file-name">{file.name}</span>
                                    </>
                                )}
                                <button onClick={() => removeFile(index)} aria-label={`إزالة ${file.name}`}>&times;</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Step 2: Customize Quiz */}
            <div className="quiz-step-card">
                <div className="quiz-step-header">
                    <span className="step-number">2</span>
                    <h3>خصص الإعدادات</h3>
                </div>
                <div className="quiz-settings-grid">
                    {/* Question Type */}
                    <div className="setting-group">
                        <label><span className="material-icons">list_alt</span> نوع الأسئلة</label>
                        <div className="segmented-control">
                            <button className={questionType === 'Multiple Choice' ? 'active' : ''} onClick={() => setQuestionType('Multiple Choice')}>اختيار من متعدد</button>
                            <button className={questionType === 'True/False' ? 'active' : ''} onClick={() => setQuestionType('True/False')}>صح / خطأ</button>
                            <button className={questionType === 'Short Answer' ? 'active' : ''} onClick={() => setQuestionType('Short Answer')}>إجابة قصيرة</button>
                        </div>
                    </div>
                    {/* Difficulty */}
                    <div className="setting-group">
                        <label><span className="material-icons">signal_cellular_alt</span> مستوى الصعوبة</label>
                         <div className="segmented-control">
                            <button className={difficulty === 'Easy' ? 'active' : ''} onClick={() => setDifficulty('Easy')}>سهل</button>
                            <button className={difficulty === 'Medium' ? 'active' : ''} onClick={() => setDifficulty('Medium')}>متوسط</button>
                            <button className={difficulty === 'Hard' ? 'active' : ''} onClick={() => setDifficulty('Hard')}>صعب</button>
                        </div>
                    </div>
                    {/* Number of Questions */}
                    <div className="setting-group">
                         <label htmlFor="num-questions"><span className="material-icons">tag</span> عدد الأسئلة</label>
                        <input
                            id="num-questions"
                            type="number"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value, 10)))}
                            min="1"
                            max="20"
                        />
                    </div>
                </div>
            </div>

            {/* Step 3: Generate */}
            <button onClick={handleGenerateQuestions} disabled={isLoading || (!topic.trim() && files.length === 0)} className="generate-btn">
                <span className="material-icons">auto_awesome</span>
                {isLoading ? 'جاري الإنشاء...' : 'إنشاء الأسئلة'}
            </button>
            
            {isLoading && <EnhancedLoader messages={quizLoadingMessages} />}
            
            {error && <p className="error-message">{error}</p>}

            {questions.length > 0 && (
                <div className={`questions-container ${showAnswers ? 'answers-shown' : ''}`}>
                    <h2>الأسئلة التي تم إنشاؤها</h2>

                    {showAnswers && scoredQuestionCount > 0 && (
                        <div className="quiz-score-container">
                            <h3>النتيجة: {score} / {scoredQuestionCount}</h3>
                        </div>
                    )}

                    {questions.map((q, index) => (
                        <div key={index} className="question-card">
                            <p className="question-text"><strong>{index + 1}. </strong>{q.question}</p>
                            
                            {q.type === 'Multiple Choice' && q.options && (
                                <ul className="options-list">
                                    {q.options.map((option: string, i: number) => {
                                        const isSelected = userAnswers[index] === option;
                                        const isCorrect = q.answer === option;
                                        let className = '';
                                        if (showAnswers) {
                                            if (isCorrect) className = 'correct';
                                            else if (isSelected && !isCorrect) className = 'incorrect';
                                        } else if (isSelected) className = 'selected';
                                        return ( <li key={i} className={className} onClick={() => !showAnswers && handleSelectAnswer(index, option)} > {option} </li> );
                                    })}
                                </ul>
                            )}

                            {q.type === 'True/False' && (
                                <div className="true-false-options">
                                    {['صح', 'خطأ'].map((option: string, i: number) => {
                                        const isSelected = userAnswers[index] === option;
                                        const isCorrect = q.answer === option;
                                        let className = 'tf-option-btn';
                                        if (showAnswers) {
                                            if (isCorrect) className += ' correct';
                                            else if (isSelected && !isCorrect) className += ' incorrect';
                                        } else if (isSelected) className += ' selected';
                                        return ( <button key={i} className={className} onClick={() => handleSelectAnswer(index, option)} disabled={showAnswers} > {option === 'صح' ? ( <><span className="material-icons">check_circle</span> صح</> ) : ( <><span className="material-icons">cancel</span> خطأ</> )} </button> );
                                    })}
                                </div>
                            )}

                            {q.type === 'Short Answer' && (
                                <div className="short-answer-container">
                                    <textarea
                                        className="short-answer-input"
                                        placeholder={showAnswers && !userAnswers[index] ? "لم تقدم إجابة" : "اكتب إجابتك هنا..."}
                                        value={userAnswers[index] || ''}
                                        onChange={(e) => handleSelectAnswer(index, e.target.value)}
                                        readOnly={showAnswers}
                                        rows={3}
                                    ></textarea>
                                    {showAnswers && (
                                        <div className="short-answer-feedback">
                                            {(isEvaluating && evaluationResults[index] === undefined && userAnswers[index]?.trim()) ? (
                                                <div className="evaluating-notice">
                                                    <div className="loader small"></div>
                                                    <span>جاري تقييم إجابتك...</span>
                                                </div>
                                            ) : evaluationResults[index] ? (
                                                <div className="evaluation-result">
                                                    <div className="score-display">
                                                        <span className="score-label">التقييم:</span>
                                                        <div className="score-bar-container">
                                                            <div className="score-bar" style={{ width: `${evaluationResults[index].score * 10}%` }}></div>
                                                        </div>
                                                        <span className="score-text">{evaluationResults[index].score} / 10</span>
                                                    </div>
                                                    <p className="feedback-text">
                                                        <span className="material-icons">comment</span>
                                                        {evaluationResults[index].feedback}
                                                    </p>
                                                </div>
                                            ) : null}
                                            <div className="answer-text">
                                                <strong>الإجابة النموذجية:</strong> {q.answer}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {!showAnswers && (
                        <button onClick={handleShowAnswers} className="reveal-answers-btn">
                             <span className="material-icons">visibility</span>
                            إظهار الحل
                        </button>
                    )}
                </div>
            )}
        </>
    );
};


// --- IQ Test Page Component ---
const IQTestPage = () => {
    const [testStarted, setTestStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [testFinished, setTestFinished] = useState(false);
    const [difficulty, setDifficulty] = useState('medium');
    const [numQuestions, setNumQuestions] = useState(5);
    const [subject, setSubject] = useState('general');
    const [timeLeft, setTimeLeft] = useState(60);
    const [currentTestQuestions, setCurrentTestQuestions] = useState<any[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const timeoutRef = useRef<number | null>(null);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        // Clear timers if the component unmounts
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const getTimerDuration = () => {
        switch (difficulty) {
            case 'easy': return 45;
            case 'medium': return 60;
            case 'hard': return 90;
            default: return 60;
        }
    };

    useEffect(() => {
        if (isAnswered || !testStarted || testFinished) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        setTimeLeft(getTimerDuration()); // Reset timer for the new question

        timerRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    handleAnswerClick(null); // Time's up
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentQuestionIndex, testStarted, testFinished, isAnswered]);

    const handleStartTest = async () => {
        setIsLoading(true);
        setError('');

        const difficultyMap: Record<string, string> = {
            easy: 'سهل',
            medium: 'متوسط',
            hard: 'صعب'
        };
        
        const subjectMap: Record<string, string> = {
            general: 'عام ومتنوع',
            logic: 'المنطق والتفكير النقدي',
            math: 'الرياضيات والأنماط العددية',
            spatial: 'التفكير المكاني والبصري'
        };

        const promptText = `
            قم بإنشاء ${numQuestions} سؤالاً لاختبار الذكاء (IQ) في موضوع "${subjectMap[subject]}" وبمستوى صعوبة "${difficultyMap[difficulty]}".
            يجب أن تكون إجابتك بأكملها عبارة عن كائن JSON واحد بمفتاح واحد هو "questions".
            يجب أن تكون قيمة "questions" عبارة عن مصفوفة من كائنات الأسئلة.

            يجب أن يحتوي كل كائن سؤال على الخصائص التالية:
            - "question": سلسلة نصية تحتوي على نص السؤال.
            - "options": مصفوفة تحتوي على 4 سلاسل نصية بالضبط تمثل خيارات الاختيار من متعدد.
            - "correctAnswer": سلسلة نصية تحتوي على الإجابة الصحيحة، والتي يجب أن تكون إحدى السلاسل النصية من مصفوفة "options".

            يرجى الالتزام الصارم بتنسيق JSON هذا. يجب أن تكون جميع النصوص باللغة العربية.
        `;

        try {
            const proxyResponse = await fetch('/.netlify/functions/gemini-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemini-2.5-flash',
                    contents: [{ parts: [{ text: promptText }] }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                questions: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            question: { type: Type.STRING },
                                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            correctAnswer: { type: Type.STRING },
                                        }
                                    }
                                }
                            }
                        },
                    },
                })
            });

            if (!proxyResponse.ok) {
                throw new Error("Proxy request failed.");
            }
            const response = await proxyResponse.json();

            let parsedJson;
            try {
                let jsonStr = response.text.trim();
                parsedJson = JSON.parse(jsonStr);
            } catch (e) {
                console.error("Failed to parse IQ test JSON:", e);
                throw new Error("Failed to parse IQ test JSON from model response.");
            }

            if (parsedJson.questions && parsedJson.questions.length > 0) {
                setCurrentTestQuestions(parsedJson.questions);
                setTestStarted(true);
                setTestFinished(false);
                setCurrentQuestionIndex(0);
                setScore(0);
                setIsAnswered(false);
                setSelectedAnswer(null);
            } else {
                throw new Error("Generated questions are invalid or empty.");
            }
        } catch (err) {
            console.error("Error generating IQ questions:", err);
            setError('عذراً، حدث خطأ أثناء إنشاء الأسئلة. الرجاء المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerClick = (selectedOption: string | null) => {
        if (isAnswered) return;

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setIsAnswered(true);
        setSelectedAnswer(selectedOption);

        if (selectedOption !== null && selectedOption === currentTestQuestions[currentQuestionIndex].correctAnswer) {
            setScore(prevScore => prevScore + 1);
        }

        timeoutRef.current = window.setTimeout(() => {
            const nextQuestionIndex = currentQuestionIndex + 1;
            if (nextQuestionIndex < currentTestQuestions.length) {
                setCurrentQuestionIndex(nextQuestionIndex);
                setIsAnswered(false);
                setSelectedAnswer(null);
            } else {
                setTestFinished(true);
            }
        }, 1200);
    };
    
    const getScoreMessage = () => {
        const percentage = (score / currentTestQuestions.length) * 100;
        if (percentage >= 90) {
            return "مذهل! نتيجتك تشير إلى مستوى عالٍ جدًا من الذكاء والقدرة على التحليل العميق. أنت تمتلك عقلاً استثنائياً.";
        } else if (percentage >= 70) {
            return "أداء رائع! أنت أذكى من المتوسط ولديك مهارات تفكير منطقي قوية. استمر في تحدي عقلك.";
        } else if (percentage >= 50) {
            return "نتيجة جيدة! أنت تمتلك مستوى جيد من الذكاء. الممارسة المستمرة ستصقل مهاراتك أكثر.";
        } else if (percentage >= 30) {
            return "لا بأس بها. كل رحلة تبدأ بخطوة. حاول مرة أخرى وركز على فهم نمط الأسئلة.";
        } else {
            return "هذه مجرد بداية. لا تدع هذه النتيجة تحبطك. التدريب والممارسة يصنعان الفارق!";
        }
    };

    const iqLoadingMessages = ["نجهز لك تحدياً حقيقياً للعقل...", "نختار أسئلة فريدة من نوعها...", "الاختبار على وشك البدء... استعد!"];

    if (!testStarted) {
        return (
            <div className="iq-setup-page">
                <div className="quiz-step-card">
                    <div className="quiz-step-header">
                        <span className="step-number">1</span>
                        <h3>اختر الإعدادات</h3>
                    </div>
                    <div className="quiz-settings-grid">
                        {/* Subject */}
                        <div className="setting-group">
                            <label><span className="material-icons">category</span> الموضوع</label>
                            <div className="segmented-control">
                                <button className={subject === 'general' ? 'active' : ''} onClick={() => setSubject('general')}>عام</button>
                                <button className={subject === 'logic' ? 'active' : ''} onClick={() => setSubject('logic')}>المنطق</button>
                                <button className={subject === 'math' ? 'active' : ''} onClick={() => setSubject('math')}>الرياضيات</button>
                                <button className={subject === 'spatial' ? 'active' : ''} onClick={() => setSubject('spatial')}>مكاني</button>
                            </div>
                        </div>
                        {/* Difficulty */}
                        <div className="setting-group">
                            <label><span className="material-icons">signal_cellular_alt</span> مستوى الصعوبة</label>
                            <div className="segmented-control">
                                <button className={difficulty === 'easy' ? 'active' : ''} onClick={() => setDifficulty('easy')}>سهل</button>
                                <button className={difficulty === 'medium' ? 'active' : ''} onClick={() => setDifficulty('medium')}>متوسط</button>
                                <button className={difficulty === 'hard' ? 'active' : ''} onClick={() => setDifficulty('hard')}>صعب</button>
                            </div>
                        </div>
                        {/* Number of Questions */}
                        <div className="setting-group">
                            <label><span className="material-icons">tag</span> عدد الأسئلة</label>
                            <div className="segmented-control">
                                <button className={numQuestions === 5 ? 'active' : ''} onClick={() => setNumQuestions(5)}>5</button>
                                <button className={numQuestions === 10 ? 'active' : ''} onClick={() => setNumQuestions(10)}>10</button>
                                <button className={numQuestions === 15 ? 'active' : ''} onClick={() => setNumQuestions(15)}>15</button>
                            </div>
                        </div>
                    </div>
                </div>
    
                <button onClick={handleStartTest} className="generate-btn" disabled={isLoading}>
                    <span className="material-icons">psychology</span>
                    {isLoading ? 'جاري إنشاء الأسئلة...' : 'ابدأ الاختبار'}
                </button>
    
                {isLoading && <EnhancedLoader messages={iqLoadingMessages} />}
                {error && <p className="error-message">{error}</p>}
            </div>
        );
    }

    if (testFinished) {
        return (
            <div className="iq-results-card">
                <h1>انتهى الاختبار!</h1>
                <p className="iq-score-text">نتيجتك هي: <strong>{score}</strong> من <strong>{currentTestQuestions.length}</strong></p>
                <p className="iq-feedback-text">{getScoreMessage()}</p>
                <button onClick={() => setTestStarted(false)} className="iq-restart-btn">
                    <span className="material-icons">refresh</span>
                    العودة للقائمة
                </button>
            </div>
        );
    }

    const currentQuestion = currentTestQuestions[currentQuestionIndex];
    const progressPercentage = ((currentQuestionIndex) / currentTestQuestions.length) * 100;

    return (
        <div className="iq-test-content">
             <div className="iq-progress-bar-container">
                <div className="iq-progress-bar" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="iq-question-container">
                 <div className="iq-question-header">
                    <p className="iq-question-counter">السؤال {currentQuestionIndex + 1} / {currentTestQuestions.length}</p>
                    <div className="iq-timer">
                        <span className="material-icons">timer</span>
                        <span>{timeLeft} ث</span>
                    </div>
                </div>
                <div className="iq-timer-progress-wrapper">
                    <div className="iq-timer-progress" style={{width: `${(timeLeft / getTimerDuration()) * 100}%`}}></div>
                </div>
                <h2 className="iq-question-text">{currentQuestion.question}</h2>
                <div className="iq-options-list">
                    {currentQuestion.options.map((option: string, index: number) => {
                        let buttonClass = 'iq-option-btn';
                        if (isAnswered) {
                            if (option === currentQuestion.correctAnswer) {
                                buttonClass += ' correct';
                            } else if (option === selectedAnswer) {
                                buttonClass += ' incorrect';
                            }
                        }
                        return (
                            <button 
                                key={index} 
                                onClick={() => handleAnswerClick(option)} 
                                className={buttonClass}
                                disabled={isAnswered}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- Mind Map Page Component (NEW) ---
const MindMapRenderer: React.FC<MindMapRendererProps> = ({ data, colorScheme }) => {
    // FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
    const renderNode = (node: MindMapNode): React.ReactElement => (
        <li key={node.topic}>
            <span>{node.topic}</span>
            {node.children && node.children.length > 0 && (
                <ul>
                    {node.children.map((child: MindMapNode) => renderNode(child))}
                </ul>
            )}
        </li>
    );

    return (
        <div className={`mindmap-render-area ${colorScheme}`}>
            <ul>{renderNode(data)}</ul>
        </div>
    );
};

const MindMapPage = () => {
    const [text, setText] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);

    // Customization state
    const [layout, setLayout] = useState('شجري'); // 'شجري', 'مركزي'
    const [colorScheme, setColorScheme] = useState('vibrant'); // 'vibrant', 'professional', 'pastel'
    const [density, setDensity] = useState('متوسط'); // 'موجز', 'متوسط', 'مفصل'
    
    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const resultContainerRef = useRef<HTMLDivElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prevFiles => [...prevFiles, ...Array.from(event.target.files!)]);
            (event.target as HTMLInputElement).value = '';
        }
    };

    const removeFile = (indexToRemove: number) => {
        setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const startCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = stream;
                setIsCameraOpen(true);
            } catch (err) {
                console.error("Error accessing camera: ", err);
                alert("لا يمكن الوصول إلى الكاميرا. يرجى التحقق من الأذونات.");
            }
        }
    };
    
    useEffect(() => {
        if (isCameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);


    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
        streamRef.current = null;
    };

    const captureFrame = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (!context) return;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                if(blob) {
                    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setFiles(prevFiles => [...prevFiles, file]);
                }
                stopCamera();
            }, 'image/jpeg');
        }
    };
    
    const handleGenerateMap = async () => {
        if (!text.trim() && files.length === 0) return;
        setIsLoading(true);
        setError('');
        setMindMapData(null);
        
        try {
            const promptText = `
                Based on the provided content (text and/or images), create a mind map structure.
                Your response MUST be a single JSON object with a single key "mindMap".
                The value of "mindMap" should be an object representing the root node.

                Each node in the mind map must be an object with the following properties:
                - "topic": A string for the node's title.
                - "children": An optional array of node objects for its sub-topics.

                Please adhere strictly to this JSON format. Respond in Arabic.

                Constraints for generation:
                - Layout preference: ${layout} (This is a hint for structure. 'شجري' is top-down, 'مركزي' is balanced).
                - Density: ${density} (A ${density} map should have an appropriate level of detail. 'موجز' means only main ideas, 'مفصل' means many sub-points).

                ---
                User-provided text: "${text.trim()}"
                ---
            `;
            
            const messageParts: any[] = [{ text: promptText }];

            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    const base64Data = await fileToBase64(file);
                    messageParts.push({
                        inlineData: { mimeType: file.type, data: base64Data },
                    });
                }
            }
            
            const proxyResponse = await fetch('/.netlify/functions/gemini-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemini-2.5-flash',
                    contents: [{ parts: messageParts }],
                    config: {
                        responseMimeType: "application/json",
                    },
                })
            });

            if (!proxyResponse.ok) {
                throw new Error("Proxy request failed.");
            }
            const response = await proxyResponse.json();
            
            let parsedJson;
            try {
                let jsonStr = response.text.trim();
                parsedJson = JSON.parse(jsonStr);
            } catch (e) {
                console.error("Failed to parse mind map JSON:", e);
                throw new Error("Failed to parse mind map JSON from model response.");
            }

            if (parsedJson.mindMap && parsedJson.mindMap.topic) {
                setMindMapData(parsedJson.mindMap);
            } else {
                throw new Error("لم يتمكن النموذج من إنشاء خريطة ذهنية بالصيغة الصحيحة.");
            }

        } catch (err) {
            console.error("Error generating mind map:", err);
            setError(`عذراً، حدث خطأ: ${(err as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        const { html2canvas } = window as any;
        if (!html2canvas) {
            setError('مكتبة التحميل غير متاحة.');
            return;
        }
        if (resultContainerRef.current) {
            html2canvas(resultContainerRef.current, {
                backgroundColor: getComputedStyle(document.body).getPropertyValue('--background-color'),
                useCORS: true,
                scale: 2
            }).then((canvas: HTMLCanvasElement) => {
                const link = document.createElement('a');
                link.download = 'mind-map.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    };

    const mindMapLoadingMessages = ["نحلل العلاقات بين الأفكار...", "نرسم الفروع الرئيسية للخريطة...", "ننظم الخريطة بشكل مرئي وجذاب..."];

    return (
        <>
             <div className="quiz-step-card">
                 <div className="quiz-step-header">
                    <span className="step-number">1</span>
                    <h3>أدخل المحتوى</h3>
                </div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="اكتب النص أو الفكرة الرئيسية هنا..."
                    rows={4}
                    aria-label="Content for mind map"
                ></textarea>

                {files.length > 0 && (
                    <div className="file-preview-area">
                        {files.map((file, index) => (
                            <div key={index} className="file-preview-item">
                                <img src={URL.createObjectURL(file)} alt={file.name} />
                                <button onClick={() => removeFile(index)} aria-label={`إزالة ${file.name}`}>&times;</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="summarizer-controls">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                        multiple
                        aria-hidden="true"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="control-btn">
                        <span className="material-icons">attach_file</span> إرفاق صورة
                    </button>
                    <button onClick={startCamera} className="control-btn">
                        <span className="material-icons">photo_camera</span> فتح الكاميرا
                    </button>
                </div>
            </div>

            {isCameraOpen && (
                <div className="camera-modal">
                    <div className="camera-view">
                        <video ref={videoRef} autoPlay playsInline aria-label="Camera feed"></video>
                        <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true"></canvas>
                        <div className="camera-controls">
                            <button onClick={captureFrame} className="capture-btn">التقاط</button>
                            <button onClick={stopCamera} className="close-btn">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="quiz-step-card">
                <div className="quiz-step-header">
                    <span className="step-number">2</span>
                    <h3>خصص الخريطة</h3>
                </div>
                 <div className="quiz-settings-grid">
                    <div className="setting-group">
                        <label><span className="material-icons">schema</span> الشكل</label>
                        <div className="segmented-control">
                            <button className={layout === 'شجري' ? 'active' : ''} onClick={() => setLayout('شجري')}>شجري</button>
                            <button className={layout === 'مركزي' ? 'active' : ''} onClick={() => setLayout('مركزي')}>مركزي</button>
                        </div>
                    </div>
                     <div className="setting-group">
                        <label><span className="material-icons">palette</span> الألوان</label>
                        <div className="segmented-control">
                            <button className={colorScheme === 'vibrant' ? 'active' : ''} onClick={() => setColorScheme('vibrant')}>مشرقة</button>
                            <button className={colorScheme === 'professional' ? 'active' : ''} onClick={() => setColorScheme('professional')}>رسمية</button>
                            <button className={colorScheme === 'pastel' ? 'active' : ''} onClick={() => setColorScheme('pastel')}>هادئة</button>
                        </div>
                    </div>
                    <div className="setting-group">
                        <label><span className="material-icons">density_medium</span> الكثافة</label>
                        <div className="segmented-control">
                            <button className={density === 'موجز' ? 'active' : ''} onClick={() => setDensity('موجز')}>موجزة</button>
                            <button className={density === 'متوسط' ? 'active' : ''} onClick={() => setDensity('متوسط')}>متوسطة</button>
                            <button className={density === 'مفصل' ? 'active' : ''} onClick={() => setDensity('مفصل')}>مفصلة</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <button onClick={handleGenerateMap} disabled={isLoading || (!text.trim() && files.length === 0)} className="generate-btn">
                 <span className="material-icons">account_tree</span>
                {isLoading ? 'جاري رسم الخريطة...' : 'إنشاء الخريطة'}
            </button>
            
            {isLoading && <EnhancedLoader messages={mindMapLoadingMessages} />}
            {error && <p className="error-message">{error}</p>}

            {mindMapData && (
                <div className="results-container">
                    <div className="result-section">
                        <div className="mindmap-header">
                             <h2>الخريطة الذهنية</h2>
                             <button onClick={handleDownload} className="download-btn">
                                <span className="material-icons">download</span>
                                تحميل
                            </button>
                        </div>
                       
                        <div ref={resultContainerRef} className="mindmap-canvas">
                             <MindMapRenderer data={mindMapData} colorScheme={colorScheme} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// --- Tools Page (Hub) Component ---
const ToolsPage = () => {
    const [activeTool, setActiveTool] = useState<string | null>(null);

    const tools = [
        { id: 'summarizer', name: 'أداة التلخيص', icon: 'mediation', description: 'لخص النصوص، الكتب، أو حتى الصور بذكاء', color: '#4A90E2', colorRgb: '74, 144, 226' },
        { id: 'quiz', name: 'صانع الاختبارات', icon: 'quiz', description: 'أنشئ أسئلة امتحانية من أي نص أو ملف', color: '#50E3C2', colorRgb: '80, 227, 194' },
        { id: 'iq', name: 'اختبار الذكاء', icon: 'psychology', description: 'اختبر مهاراتك في التفكير المنطقي', color: '#9013FE', colorRgb: '144, 19, 254' },
        { id: 'tts', name: 'القارئ الصوتي', icon: 'volume_up', description: 'حوّل النصوص والصور إلى ملفات صوتية', color: '#F5A623', colorRgb: '245, 166, 35' },
        { id: 'mindmap', name: 'صانع الخرائط الذهنية', icon: 'account_tree', description: 'حوّل النصوص والأفكار إلى خرائط ذهنية بصرية', color: '#7B66FF', colorRgb: '123, 102, 255' },

    ];

    const renderActiveTool = () => {
        switch (activeTool) {
            case 'summarizer':
                return <SummarizerPage />;
            case 'tts':
                return <TextToSpeechPage />;
            case 'quiz':
                return <QuizBuilderPage />;
            case 'iq':
                return <IQTestPage />;
            case 'mindmap':
                return <MindMapPage />;
            default:
                return null;
        }
    };
    
    const activeToolData = tools.find(t => t.id === activeTool);

    if (activeTool && activeToolData) {
        // Render the active tool with a back button
        return (
            <div className="page tools-page active-tool">
                <div className="header">
                    <button onClick={() => setActiveTool(null)} className="back-button" aria-label="العودة">
                        <span className="material-icons">arrow_forward</span>
                    </button>
                    <h1>{activeToolData.name}</h1>
                    <p>{activeToolData.description}</p>
                </div>
                {renderActiveTool()}
            </div>
        );
    }

    // Render the tool selection grid
    return (
        <div className="page tools-page">
            <div className="header">
                <h1>صندوق الأدوات</h1>
                <p>اختر الأداة التي تناسب احتياجك</p>
            </div>
            <div className="vpn-note">
                <span className="material-icons">info_outline</span>
                <p>ملاحظة: إذا واجهت مشكلة في عمل الأدوات، قد يساعد استخدام VPN في حلها.</p>
            </div>
            <div className="tools-list">
                {tools.map(tool => (
                    <div
                        key={tool.id}
                        className="tool-card-new"
                        onClick={() => setActiveTool(tool.id)}
                        style={{ '--tool-color-rgb': tool.colorRgb } as React.CSSProperties}
                    >
                        <div className="tool-icon-container" style={{ background: `linear-gradient(135deg, ${tool.color}, ${shadeColor(tool.color, -20)})` }}>
                            <span className="material-icons">{tool.icon}</span>
                        </div>
                        <div className="tool-text-content">
                            <h3>{tool.name}</h3>
                            <p className="tool-card-new-description">{tool.description}</p>
                        </div>
                        <span className="material-icons tool-arrow">chevron_right</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Settings Page Component ---
const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
    const [themeColor, setThemeColor] = useState(localStorage.getItem('themeColor') || '#B89F71');
    const [themeMode, setThemeMode] = useState(localStorage.getItem('themeMode') || 'auto');
    const [appBackground, setAppBackground] = useState(localStorage.getItem('appBackground') || 'none');

    const handleColorChange = (color: string) => {
        localStorage.setItem('themeColor', color);
        setThemeColor(color);
        const darkColor = shadeColor(color, -20);
        document.documentElement.style.setProperty('--primary-color', color);
        document.documentElement.style.setProperty('--primary-dark', darkColor);
        
        // New: Set RGB variable for glow effect
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            document.documentElement.style.setProperty('--primary-color-rgb', `${r}, ${g}, ${b}`);
        }
    };

    const handleModeChange = (mode: string) => {
        localStorage.setItem('themeMode', mode);
        setThemeMode(mode);
        if (mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    };

    const handleBackgroundChange = (bgUrl: string) => {
        localStorage.setItem('appBackground', bgUrl);
        setAppBackground(bgUrl);
        if (bgUrl !== 'none') {
            document.body.style.backgroundImage = `url(${bgUrl})`;
        } else {
            document.body.style.backgroundImage = 'none';
        }
    };
    
    const themeColors = [
        { name: 'ذهبي', value: '#B89F71' },
        { name: 'أزرق', value: '#4A90E2' },
        { name: 'أخضر', value: '#50E3C2' },
        { name: 'أحمر', value: '#D0021B' },
        { name: 'بنفسجي', value: '#9013FE' },
        { name: 'برتقالي', value: '#F5A623' },
        { name: 'وردي', value: '#E91E63' },
        { name: 'تركواز', value: '#009688' },
        { name: 'رمادي', value: '#607D8B' },
    ];

    const backgrounds = [
        { name: 'بدون', value: 'none' },
        { name: 'أقواس', value: 'https://www.transparenttextures.com/patterns/arches.png' },
        { name: 'مكعبات', value: 'https://www.transparenttextures.com/patterns/cubes.png' },
        { name: 'طوب قطري', value: 'https://www.transparenttextures.com/patterns/diagonal-striped-brick.png' },
        { name: 'ألماس', value: 'https://www.transparenttextures.com/patterns/diamond-upholstery.png' },
        { name: 'زخرفة', value: 'https://www.transparenttextures.com/patterns/fancy-deboss.png' },
        { name: 'هندسة', value: 'https://www.transparenttextures.com/patterns/inspiration-geometry.png' },
        { name: 'ورق مسطر', value: 'https://www.transparenttextures.com/patterns/lined-paper.png' },
        { name: 'خطوط', value: 'https://www.transparenttextures.com/patterns/subtle-stripes.png' },
        { name: 'شبكة', value: 'https://www.transparenttextures.com/patterns/tiny-grid.png' },
        { name: 'أمواج', value: 'https://www.transparenttextures.com/patterns/wavecut.png' }
    ];
    
    return (
        <div className="page settings-page">
            <div className="header">
                <button onClick={onBack} className="back-button" aria-label="العودة">
                    <span className="material-icons">arrow_forward</span>
                </button>
                <h1>الإعدادات</h1>
            </div>

            {/* Theme Color Section */}
            <div className="quiz-step-card">
                <div className="quiz-step-header">
                    <span className="material-icons">palette</span>
                    <h3>لون التطبيق</h3>
                </div>
                <div className="color-swatches">
                    {themeColors.map(color => (
                        <button 
                            key={color.value} 
                            className={`color-swatch ${themeColor === color.value ? 'active' : ''}`}
                            style={{ backgroundColor: color.value }}
                            onClick={() => handleColorChange(color.value)}
                            aria-label={`تغيير اللون إلى ${color.name}`}
                        />
                    ))}
                </div>
            </div>

             {/* Application Background Section */}
             <div className="quiz-step-card">
                <div className="quiz-step-header">
                    <span className="material-icons">texture</span>
                    <h3>خلفية التطبيق</h3>
                </div>
                <div className="background-swatches">
                    {backgrounds.map(bg => (
                        <button
                            key={bg.value}
                            className={`background-swatch ${appBackground === bg.value ? 'active' : ''}`}
                            onClick={() => handleBackgroundChange(bg.value)}
                            aria-label={`تغيير الخلفية إلى ${bg.name}`}
                        >
                            <div
                                style={{
                                    backgroundImage: bg.value !== 'none' ? `url(${bg.value})` : 'none',
                                    backgroundColor: 'var(--background-color)',
                                    width: '100%', height: '100%',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {bg.value === 'none' && <span className="material-icons" style={{ fontSize: '1.2rem', color: 'var(--text-secondary-color)' }}>block</span>}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Theme Mode Section */}
            <div className="quiz-step-card">
                <div className="quiz-step-header">
                    <span className="material-icons">brightness_6</span>
                    <h3>وضع المظهر</h3>
                </div>
                 <div className="segmented-control">
                    <button type="button" className={themeMode === 'light' ? 'active' : ''} onClick={() => handleModeChange('light')}>نهاري</button>
                    <button type="button" className={themeMode === 'dark' ? 'active' : ''} onClick={() => handleModeChange('dark')}>ليلي</button>
                    <button type="button" className={themeMode === 'auto' ? 'active' : ''} onClick={() => handleModeChange('auto')}>تلقائي</button>
                </div>
            </div>

            {/* The BIG new feature update */}
            <div className="quiz-step-card">
                <div className="quiz-step-header">
                    <span className="material-icons" style={{color: '#E4A11B'}}>auto_awesome</span>
                    <h3>التحديث القادم بعون الله</h3>
                </div>
                <p className="about-us-text">
                    نعمل على ميزة ثورية: تخصيص الذكاء الاصطناعي لكل كتاب. ستتمكن من سؤال النموذج عن أي شيء في كتابك وسيجيبك بدقة من محتواه. نخطط أيضًا لأدوات أخرى تساعد في الدراسة. يمكنك دائمًا اقتراح أدوات جديدة لتحسين التطبيق عبر صفحة الاقتراحات.
                </p>
            </div>

            {/* General Upcoming Updates Section */}
            <div className="quiz-step-card">
                <div className="quiz-step-header">
                    <span className="material-icons">upcoming</span>
                    <h3>تحديثات قادمة أخرى</h3>
                </div>
                <ul className="info-list">
                    <li>إضافة دورات تعليمية مسجلة للمواد الأساسية.</li>
                    <li>توفير قسم خاص للملخصات والنماذج الامتحانية.</li>
                    <li>إنشاء غرف دردشة جماعية لكل مادة دراسية.</li>
                    <li>تحسينات مستمرة بناءً على اقتراحاتكم القيمة.</li>
                </ul>
            </div>

            {/* Follow Us Section */}
            <div className="quiz-step-card">
                <div className="quiz-step-header">
                    <span className="material-icons">group_add</span>
                    <h3>تابعنا على</h3>
                </div>
                <div className="social-links-container">
                    <a href="https://www.facebook.com/profile.php?id=61581813059961&mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" className="social-link facebook">
                        فيسبوك
                    </a>
                    <a href="https://www.instagram.com/the.syrian.student?igsh=MWkyYzMydTc4ZnY0OQ==" target="_blank" rel="noopener noreferrer" className="social-link instagram">
                        انستغرام
                    </a>
                    <a href="https://whatsapp.com/channel/0029Vb6npWr1iUxXrvmb5U00" target="_blank" rel="noopener noreferrer" className="social-link whatsapp">
                        قناة الواتساب
                    </a>
                </div>
            </div>

            {/* About Us Section */}
            <div className="quiz-step-card">
                <div className="quiz-step-header">
                    <span className="material-icons">info</span>
                    <h3>من نحن</h3>
                </div>
                <p className="about-us-text">
                    نحن فريق من المطورين والمعلمين السوريين، نسعى لتقديم أدوات تعليمية حديثة ومبتكرة لمساعدة طلابنا على التفوق الدراسي. هذا التطبيق هو خطوتنا الأولى نحو تحقيق هذا الهدف.
                </p>
            </div>
        </div>
    );
};


// --- Suggestions Page Component ---
const SuggestionsPage = () => {
    const [showSettings, setShowSettings] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [suggestionType, setSuggestionType] = useState<string | null>(null);
    const [suggestionText, setSuggestionText] = useState('');
    const [suggesterName, setSuggesterName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const MAX_CHARS = 1000;

    const handleTypeSelect = (type: string) => {
        setSuggestionType(type);
        setCurrentStep(2);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!suggestionText.trim()) {
            setError('يرجى كتابة اقتراحك قبل الإرسال.');
            return;
        }
        
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('https://n8n-tyfesdxn.us-west-1.clawcloudrun.com/webhook/aya.77', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'SuggestionsPage',
                    type: suggestionType,
                    suggestion: suggestionText,
                    name: suggesterName
                }),
            });

            if (!response.ok) {
                throw new Error('فشل الاتصال بالخادم. الرجاء المحاولة مرة أخرى.');
            }

            setIsSubmitted(true);
            setSuggestionText('');
            setSuggesterName('');
            
        } catch (err) {
            setError((err as Error).message || 'حدث خطأ غير متوقع.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (showSettings) {
        return <SettingsPage onBack={() => setShowSettings(false)} />;
    }

    if (isSubmitted) {
        return (
            <div className="page suggestions-page">
                 <div className="header">
                    <h1>الاقتراحات والتحسينات</h1>
                </div>
                <div className="suggestion-success-container">
                    <div className="success-icon-wrapper">
                        <svg className="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                            <circle className="success-checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                            <path className="success-checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                        </svg>
                    </div>
                    <h2>شكرًا جزيلاً لك!</h2>
                    <p>تم إرسال اقتراحك بنجاح. نحن نقدر وقتك ومساهمتك، وسنأخذ أفكارك بعين الاعتبار في التحديثات القادمة.</p>
                    <button onClick={() => { setIsSubmitted(false); setCurrentStep(1); setSuggestionType(null); }} className="generate-btn" style={{width: "auto", padding: "0.75rem 1.5rem", marginTop: '1rem'}}>
                        تقديم اقتراح آخر
                    </button>
                </div>
            </div>
        );
    }
    
    const suggestionTypes = [
        { type: 'تحسين', icon: 'auto_awesome', description: 'تطوير ميزة موجودة' },
        { type: 'أداة جديدة', icon: 'add', description: 'اقتراح أداة غير موجودة' },
        { type: 'إبلاغ عن خطأ', icon: 'bug_report', description: 'الإبلاغ عن مشكلة فنية' }
    ];

    const renderContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="suggestion-step">
                        <div className="quiz-step-card">
                            <div className="quiz-step-header">
                                <span className="step-number">1</span>
                                <h3>ما هو نوع اقتراحك؟</h3>
                            </div>
                            <div className="suggestion-type-grid">
                                {suggestionTypes.map(item => (
                                    <button key={item.type} className="suggestion-type-card" onClick={() => handleTypeSelect(item.type)}>
                                        <span className="material-icons">{item.icon}</span>
                                        <h4>{item.type}</h4>
                                        <p>{item.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="suggestion-step">
                        <div className="quiz-step-card">
                            <div className="quiz-step-header">
                                <span className="step-number">2</span>
                                <h3>اشرح فكرتك بالتفصيل</h3>
                            </div>
                            <div className="textarea-wrapper">
                                <textarea
                                    id="suggestion-text"
                                    value={suggestionText}
                                    onChange={(e) => setSuggestionText(e.target.value)}
                                    placeholder="اكتب اقتراحك هنا..."
                                    rows={7}
                                    required
                                    maxLength={MAX_CHARS}
                                    aria-label="Suggestion details"
                                ></textarea>
                                <div className="char-counter">{suggestionText.length} / {MAX_CHARS}</div>
                            </div>
                        </div>
                        <div className="suggestion-nav">
                            <button onClick={() => setCurrentStep(1)} className="suggestion-nav-btn secondary">
                                <span className="material-icons">arrow_forward</span>
                                العودة
                            </button>
                            <button onClick={() => setCurrentStep(3)} className="suggestion-nav-btn primary" disabled={!suggestionText.trim()}>
                                التالي
                                <span className="material-icons">arrow_back</span>
                            </button>
                        </div>
                    </div>
                );
            case 3:
                 return (
                    <form onSubmit={handleSubmit} className="suggestion-step">
                        <div className="quiz-step-card">
                            <div className="quiz-step-header">
                                <span className="step-number">3</span>
                                <h3>اسمك (اختياري)</h3>
                            </div>
                            <p className="form-description">نود أن نشكرك بالاسم عند تطبيق اقتراحك. يمكنك ترك هذا الحقل فارغاً.</p>
                             <input
                                id="suggester-name"
                                type="text"
                                value={suggesterName}
                                onChange={(e) => setSuggesterName(e.target.value)}
                                placeholder="اكتب اسمك للمساهمة في شكرك"
                                aria-label="اسم المقترح"
                            />
                        </div>
                        {error && <p className="error-message">{error}</p>}
                        <div className="suggestion-nav">
                            <button type="button" onClick={() => setCurrentStep(2)} className="suggestion-nav-btn secondary">
                                <span className="material-icons">arrow_forward</span>
                                العودة
                            </button>
                             <button type="submit" disabled={isLoading} className="suggestion-nav-btn primary">
                                {isLoading ? (
                                    <div className="loader small" style={{borderColor: 'white', borderTopColor: 'transparent'}}></div>
                                ) : (
                                   <> إرسال الاقتراح <span className="material-icons">send</span></>
                                )}
                            </button>
                        </div>
                    </form>
                );
            default:
                return null;
        }
    }

    return (
        <div className="page suggestions-page">
            <div className="header suggestions-header">
                <div className="header-content">
                    <h1>الاقتراحات والتحسينات</h1>
                    <p>نقدر مساهمتك. شاركنا أفكارك لنجعل التطبيق أفضل.</p>
                </div>
                <button onClick={() => setShowSettings(true)} className="settings-button" aria-label="الإعدادات">
                    <span className="material-icons">settings</span>
                </button>
            </div>
            {renderContent()}
        </div>
    );
};


// --- Render App ---
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
}
