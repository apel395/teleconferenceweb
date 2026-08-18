import{StrictMode}from'react';import{createRoot}from'react-dom/client';import App from'./App';import SurveyAdmin from'./SurveyAdmin';import'./style.css';
const Root=window.location.pathname.startsWith('/admin/survey')?SurveyAdmin:App;
createRoot(document.getElementById('root')!).render(<StrictMode><Root/></StrictMode>);
