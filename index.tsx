import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPE DEFINITIONS ---
interface Role {
  roleName: string;
  salary: string;
  location: string;
}

interface Summary {
  vacancies: string;
  roles: Role[];
  syllabus: string[];
}

interface StudyPlanDay {
  day: number;
  topic: string;
  task: string;
}

interface StudyPlanWeek {
  week: number;
  days: StudyPlanDay[];
}

interface StudyPlan {
  weeklyPlan: StudyPlanWeek[];
}

// --- API SCHEMAS ---
const summarySchema = {
  type: Type.OBJECT,
  properties: {
    vacancies: {
      type: Type.STRING,
      description: "Número de vagas disponíveis, conforme descrito no edital."
    },
    roles: {
      type: Type.ARRAY,
      description: "Lista de cargos disponíveis.",
      items: {
        type: Type.OBJECT,
        properties: {
          roleName: {
            type: Type.STRING,
            description: "O nome do cargo."
          },
          salary: {
            type: Type.STRING,
            description: "O salário para o cargo."
          },
          location: {
            type: Type.STRING,
            description: "O local de trabalho."
          },
        },
        required: ["roleName", "salary", "location"],
      }
    },
    syllabus: {
      type: Type.ARRAY,
      description: "Uma lista dos tópicos do conteúdo programático. Seja bem detalhado em cada tópico.",
      items: {
        type: Type.STRING,
      }
    },
  },
  required: ["vacancies", "roles", "syllabus"],
};

const studyPlanSchema = {
  type: Type.OBJECT,
  properties: {
    weeklyPlan: {
      type: Type.ARRAY,
      description: "Plano de estudos organizado por semanas.",
      items: {
        type: Type.OBJECT,
        properties: {
          week: {
            type: Type.INTEGER,
            description: "O número da semana."
          },
          days: {
            type: Type.ARRAY,
            description: "Plano diário para a semana.",
            items: {
              type: Type.OBJECT,
              properties: {
                day: {
                  type: Type.INTEGER,
                  description: "O dia da semana (1-7)."
                },
                topic: {
                  type: Type.STRING,
                  description: "Tópico principal do dia. Usar 'Descanso' para o dia de descanso."
                },
                task: {
                  type: Type.STRING,
                  description: "Tarefa ou matéria específica para estudar. Vazio se for dia de descanso."
                },
              },
              required: ["day", "topic", "task"],
            }
          },
        },
        required: ["week", "days"],
      }
    },
  },
  required: ["weeklyPlan"],
};


// --- HELPER FUNCTIONS ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

// --- UI COMPONENTS ---
const Header = () => (
  <header className="main-header">
      <h1>ConcursoPRO</h1>
      <p>Transforme editais em planos de aprovação com IA</p>
  </header>
);

const Footer = () => (
  <footer className="app-footer">
      <span>Este é um projeto gratuito</span>
      <div className="author-info">
          <span>Autor: Mário Sena</span>
          <a href="https://www.linkedin.com/in/mcfss/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de Mário Sena">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.25 6.5 1.75 1.75 0 016.5 8.25zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.64 1.64 0 0013 14.19a1.65 1.65 0 00.06 2.54V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path></svg>
          </a>
      </div>
  </footer>
);

const HowItWorks = () => (
  <section className="how-it-works-section">
    <h2>Como Funciona?</h2>
    <div className="how-it-works-steps">
      <div className="how-it-works-step">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.33-2.34 3 3 0 013.75 5.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <h3>1. Envie seu Edital</h3>
        <p>Faça o upload do documento PDF do concurso que você deseja prestar.</p>
      </div>
      <div className="how-it-works-step">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 10.5h.008v.008h-.008V10.5zM15.998 1.5l.375 1.491a3.375 3.375 0 006.25 0l.375-1.491M18 1.5v2.25M12 18.75l-.375 1.491a3.375 3.375 0 01-6.25 0L5.002 18.75M6 18.75v2.25" />
        </svg>
        <h3>2. Análise com IA</h3>
        <p>Nossa IA irá ler, interpretar e extrair os pontos mais importantes do edital.</p>
      </div>
      <div className="how-it-works-step">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3>3. Receba seu Plano</h3>
        <p>Tenha um resumo completo e um cronograma de estudos semanal para cada cargo.</p>
      </div>
    </div>
  </section>
);

const Dashboard = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [studyPlans, setStudyPlans] = useState<Record<string, StudyPlan>>({});
  const [checkedState, setCheckedState] = useState<Record<string, Record<string, boolean>>>({});
  const [activeRole, setActiveRole] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setError("");
    } else {
      setSelectedFile(null);
      setError("Por favor, selecione um arquivo PDF.");
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError("");
    setSummary(null);

    try {
      const base64pdf = await fileToBase64(selectedFile);
      const pdfPart = { inlineData: { mimeType: 'application/pdf', data: base64pdf } };
      
      const summaryResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: "Analise o documento do edital em PDF e extraia as informações estruturadas conforme o schema JSON. Inclua cargos, salários, locais, vagas e conteúdo programático detalhado." }, pdfPart],
        config: { responseMimeType: "application/json", responseSchema: summarySchema },
      });
      const newSummary = JSON.parse(summaryResponse.text) as Summary;

      if (!newSummary.roles?.length || !newSummary.syllabus?.length) {
        throw new Error("Não foi possível extrair informações essenciais (cargos, conteúdo) do edital.");
      }

      const planPromises = newSummary.roles.map(role => 
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Para o cargo de "${role.roleName}", crie um plano de estudos semanal detalhado com base no seguinte conteúdo programático. Estruture em semanas, com 6 dias de estudo e 1 dia de descanso. Conteúdo: """${JSON.stringify(newSummary.syllabus)}"""`,
          config: { responseMimeType: "application/json", responseSchema: studyPlanSchema },
        }).then(response => ({ roleName: role.roleName, plan: JSON.parse(response.text) as StudyPlan }))
      );
      
      const results = await Promise.all(planPromises);
      const newStudyPlans: Record<string, StudyPlan> = {};
      const newCheckedState: Record<string, Record<string, boolean>> = {};
      results.forEach(result => {
        newStudyPlans[result.roleName] = result.plan;
        newCheckedState[result.roleName] = {};
      });
      
      setSummary(newSummary);
      setStudyPlans(newStudyPlans);
      setCheckedState(newCheckedState);
      setActiveRole(newSummary.roles[0].roleName);

    } catch (e) {
      console.error(e);
      setError("Ocorreu um erro ao analisar o edital. Verifique o arquivo e tente novamente.");
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
    }
  };

  const handleCheckboxChange = (role: string, weekIndex: number, dayIndex: number) => {
    const key = `week_${weekIndex}_day_${dayIndex}`;
    setCheckedState(prevState => ({
      ...prevState,
      [role]: {
        ...prevState[role],
        [key]: !prevState[role]?.[key],
      },
    }));
  };
  
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveRole(e.target.value);
  };

  const progress = useMemo(() => {
    if (!activeRole || !studyPlans[activeRole]?.weeklyPlan) return 0;
    const plan = studyPlans[activeRole].weeklyPlan;
    const totalTasks = plan.reduce((acc, week) => acc + week.days.filter(d => d.topic !== 'Descanso').length, 0);
    if (totalTasks === 0) return 0;
    const roleCheckedState = checkedState[activeRole] || {};
    const checkedTasks = Object.values(roleCheckedState).filter(Boolean).length;
    return (checkedTasks / totalTasks) * 100;
  }, [activeRole, studyPlans, checkedState]);

  return (
    <main className="dashboard-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Analisando, planejando... seu futuro começa agora!</p>
        </div>
      )}

      <section className="input-section">
        <h2>Comece por aqui</h2>
        <p className="text-secondary">Faça o upload do seu edital em PDF para a IA analisar e montar seu plano de aprovação.</p>
        <div className="file-input-wrapper">
          <input type="file" id="pdf-upload" className="file-input" accept="application/pdf" onChange={handleFileChange} disabled={isLoading} />
          <label htmlFor="pdf-upload" className="file-input-label">
            {selectedFile ? <span>{selectedFile.name}</span> : 'Clique para selecionar o arquivo'}
            <small>PDF, até 10MB</small>
          </label>
        </div>
        <button className="btn" onClick={handleAnalyze} disabled={isLoading || !selectedFile}>
          {isLoading ? "Analisando..." : "Analisar Edital"}
        </button>
        {error && <p className="error-message">{error}</p>}
      </section>

      {!summary ? (
        <HowItWorks />
      ) : (
        <section className="results-section">
          <h2>Resumo do Edital</h2>
          <div className="summary-cards">
            <div className="card full-span">
              <h3>Vagas</h3>
              <p>{summary.vacancies}</p>
            </div>
            {summary.roles.map((role, i) => (
              <div className="card" key={i}>
                <h3>{role.roleName}</h3>
                <p><strong>Salário:</strong> {role.salary}</p>
                <p><strong>Local:</strong> {role.location}</p>
              </div>
            ))}
          </div>

          <div className="plan-container">
            <div className="role-selector">
              <label htmlFor="role-select">Plano de Estudos para:</label>
              <select id="role-select" value={activeRole} onChange={handleRoleChange}>
                {summary.roles.map(role => (
                  <option key={role.roleName} value={role.roleName}>{role.roleName}</option>
                ))}
              </select>
            </div>

            <div className="progress-section">
              <div className="progress-header">
                <h2>Progresso do Plano</h2>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <div className="plan-section">
              {studyPlans[activeRole]?.weeklyPlan.map((week, weekIndex) => (
                <div key={week.week} className="week-container">
                  <h3>Semana {week.week}</h3>
                  <ul className="day-list">
                    {week.days.map((day, dayIndex) => {
                      const isChecked = !!checkedState[activeRole]?.[`week_${weekIndex}_day_${dayIndex}`];
                      return (
                        <li key={day.day} className={`day-item ${day.topic === 'Descanso' ? 'rest-day' : ''} ${isChecked ? 'checked' : ''}`}>
                          <div className="day-header">
                            {day.topic !== 'Descanso' ? (
                              <input
                                type="checkbox"
                                id={`task-${activeRole}-${weekIndex}-${dayIndex}`}
                                checked={isChecked}
                                onChange={() => handleCheckboxChange(activeRole, weekIndex, dayIndex)}
                              />
                            ) : <div style={{width: '18px', flexShrink: 0}}></div>}
                            <strong>Dia {day.day}: {day.topic}</strong>
                          </div>
                          {day.topic !== 'Descanso' && <p className="day-task">{day.task}</p>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};


// --- MAIN APP COMPONENT ---
const App = () => {
  return (
    <div className="app-wrapper">
      <Header />
      <Dashboard />
      <Footer />
    </div>
  );
};

// --- RENDER ---
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);