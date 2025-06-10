import React from "react";

const Mdb2202Schedule = () => {
  return (
    <div>
      <h2>Расписание для группы МДБ-22-02</h2>
      <table border="1">
        <thead>
          <tr>
            <th>День</th>
            <th>1 пара</th>
            <th>2 пара</th>
            <th>3 пара</th>
            <th>4 пара</th>
            <th>5 пара</th>
            <th>6 пара</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Понедельник</td>
            <td>
              Математика<br />
              Лекция<br />
              Иванов И.И.<br />
              0301
            </td>
            <td></td>
            <td></td>
            <td>Программирование<br />Лаб<br />Сидоров С.С.<br />0212</td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>Вторник</td>
            <td></td>
            <td>Английский язык<br />Семинар<br />Петрова А.А.<br />0401</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          {/* Остальные дни недели */}
        </tbody>
      </table>
    </div>
  );
};

export default Mdb2202Schedule;
