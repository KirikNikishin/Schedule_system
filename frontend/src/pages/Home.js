import React, { Component } from "react";
import { Button } from "react-bootstrap";
import { withRouter } from '../withRouter'; // см. ниже
import pdfIcon from '../pdf-icon.png';
import excelIcon from '../excel-icon.png';

const API_URL = process.env.REACT_APP_BACKEND_URL

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: []
    };
    this.fileInputRef = React.createRef();
  }

  handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);

    const allowedFiles = uploadedFiles.filter((file) =>
      ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)
    );

    const updatedFiles = [...this.state.files, ...allowedFiles].sort((a, b) =>
      a.name.localeCompare(b.name, 'ru')
    );

    this.setState({ files: updatedFiles });
  };

  triggerFileInput = () => {
    if (this.fileInputRef.current) {
      this.fileInputRef.current.click();
    }
  };

  sendFilesToBackend = async () => {
    const { files } = this.state;

    if (files.length === 0) {
      alert("Нет файлов для отправки");
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file); // тот же ключ, что и в бэкенде
    });

    try {
      const uploadResponse = await fetch(`${API_URL}/upload/`, {
        method: "POST",
        body: formData
      });

      if (!uploadResponse.ok) {
        console.error("Ошибка при загрузке файлов:", uploadResponse.statusText);
        return;
      }

      console.log("Файлы успешно загружены");

      // Второй запрос: парсинг PDF
      const pdfParseResponse = await fetch(`${API_URL}/batch-upload-pdf/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({}) // если серверу ничего не нужно — просто пустой объект
      });

      if (pdfParseResponse.ok) {
        const data = await pdfParseResponse.json();
        console.log("PDF успешно обработан:", data);
      } else {
        console.error("Ошибка при обработке PDF:", pdfParseResponse.statusText);
      }

      // Третий запрос: парсинг XLSX
      const xlsxParseResponse = await fetch(`${API_URL}/update-teachers/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({}) // если серверу ничего не нужно — просто пустой объект
      });

      if (xlsxParseResponse.ok) {
        const data = await xlsxParseResponse.json();
        console.log("XLSX успешно обработан:", data);
      } else {
        console.error("Ошибка при обработке XLSX:", xlsxParseResponse.statusText);
      }

      // Четвёртый запрос: загрузка в БД предметов
      const loadSubjectsResponse = await fetch(`${API_URL}/load-subjects/`, {
        method: "POST"
      });

      if (loadSubjectsResponse.ok) {
        const data = await loadSubjectsResponse.json();
        console.log("Предметы успешно загружены:", data);
      } else {
        console.error("Ошибка при загрузке предметов в БД:", loadSubjectsResponse.statusText);
      }

      // Пятый запрос: загрузка в БД аудиторий
      const loadAuditoriumsResponse = await fetch(`${API_URL}/load-auditoriums/`, {
        method: "POST",
      });

      if (loadAuditoriumsResponse.ok) {
        const data = await loadAuditoriumsResponse.json();
        console.log("Аудитории успешно загружены:", data);
      } else {
        console.error("Ошибка при загрузке аудиторий в БД:", loadAuditoriumsResponse.statusText);
      }

      // Шестой запрос: загрузка в БД аудиторий
      const loadTimesResponse = await fetch(`${API_URL}/load-time/`, {
        method: "POST",
      });

      if (loadTimesResponse.ok) {
        const data = await loadTimesResponse.json();
        console.log("Позиции времени успешно загружены:", data);
        this.props.navigate('/import/department');
      } else {
        console.error("Ошибка при загрузке позиций времени в БД:", loadTimesResponse.statusText);
      }
      

    } catch (error) {
      console.error("Сетевая ошибка:", error);
    }
  };




  render() {
    const pdfFiles = this.state.files.filter(file => file.type === 'application/pdf');
    const xlsxFiles = this.state.files.filter(file => file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return (
      <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
      <>
                <div className="d-flex align-items-center justify-content-between w-50 mb-2 px-2" />
        
                <div className="d-flex align-items-center justify-content-between w-50 mb-0 px-2">
                  <div
                    className="m-0 text-wrap"
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      whiteSpace: 'normal'
                    }}
                  >
                    Импорт данных
                  </div>
                </div>
        
                <div className="d-flex align-items-center w-30 mb-0 px-2">
                  <div
                    className="m-0 text-wrap"
                    style={{
                      color: 'gray',
                      whiteSpace: 'normal'
                    }}
                  >
                    Введите файлы учебных планов в формате УП «Код направления».pdf и  файлы распределения преподавателей в формате «Код кафедры».xlsx
                  </div>
                </div>
        
                <div className="d-flex align-items-center justify-content-between w-300 mb-4 px-2" />
        
                <div className="d-flex align-items-center justify-content-between w-300 mb-2 px-2">
                  <input
                    type="file"
                    accept=".pdf,.xlsx"
                    multiple
                    ref={this.fileInputRef}
                    onChange={this.handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <Button variant="dark" onClick={this.triggerFileInput}>
                    Добавить файлы
                  </Button>
                  <Button alignItems="right" variant="dark" onClick={this.sendFilesToBackend}>
                    Далее
                  </Button>
                </div>

        {/* PDF-файлы */}
        {pdfFiles.length > 0 && (
          <div className="px-2 mt-4">
            <div
                    className="m-1 text-wrap"
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      whiteSpace: 'normal'
                    }}
                  >
                    Загруженные учебные планы
                  </div>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #000',
                borderRadius: '17px',
                padding: '12px 16px',
                height: '250px',
                overflowY: 'auto'
              }}
            >
              <div className="row g-3">
                {pdfFiles.map((file, index) => (
                  <div className="col-md-6" key={index}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        border: '1px solid #000',
                        borderRadius: '17px',
                        padding: '12px 16px',
                        height: '69px'
                      }}
                    >
                      <img
                        src={pdfIcon}
                        alt="PDF icon"
                        style={{ width: '45px', height: '45px', marginRight: '16px' }}
                      />
                      <span
                        style={{
                          color: '#454545',
                          fontSize: '16px',
                          fontFamily: 'Inter, sans-serif',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {file.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* XLSX-файлы */}
        {xlsxFiles.length > 0 && (
          <div className="px-2 mt-4">
            <div
                    className="m-1 text-wrap"
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      whiteSpace: 'normal'
                    }}
                  >
                    Загруженные распределения преподавателей
                  </div>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #000',
                borderRadius: '17px',
                padding: '12px 16px',
                height: '250px',
                overflowY: 'auto'
              }}
            >
              <div className="row g-3">
                {xlsxFiles.map((file, index) => (
                  <div className="col-md-2" key={index}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        border: '1px solid #000',
                        borderRadius: '17px',
                        padding: '12px 16px',
                        height: '69px'
                      }}
                    >
                      <img
                        src={excelIcon}
                        alt="Excel icon"
                        style={{ width: '45px', height: '45px', marginRight: '16px' }}
                      />
                      <span
                        style={{
                          color: '#000000',
                          fontSize: '16px',
                          fontFamily: 'Inter, sans-serif',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {file.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
      </div>
    );
  }
}

export default withRouter(Home);
