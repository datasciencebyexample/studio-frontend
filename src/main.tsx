import { FormEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api, session } from "./api";
import logo from "./assets/logo.png";
import "./styles.css";
const cards: any = {
  times: "次卡",
  month: "月卡",
  quarter: "季卡",
  year: "年卡",
};
const avatars = [
  ["ballet", "🩰"],
  ["ribbon", "🎀"],
  ["music", "🎵"],
  ["flower", "🌷"],
  ["star", "⭐"],
  ["wave", "🌊"],
];
const courses: any = {
  daily: [
    ["素质训练", 60],
    ["指向性训练（肩背核心）", 60],
    ["指向性训练（臀腿核心）", 60],
    ["柔韧度训练和脚背", 60],
    ["古典芭蕾基训", 90],
  ],
  custom: [
    ["足尖", 60],
    ["1对1", 60],
    ["现代舞技术", 90],
    ["古典芭蕾剧目", 90],
    ["接触即兴", 90],
  ],
};
const appointmentStatus: Record<string, string> = {
  pending: "预约成功，待老师确认",
  booked: "预约成功，待老师确认",
  confirmed: "已确认",
  cancelled_by_student: "已取消",
  cancelled_by_teacher: "老师已取消",
  cancelled_by_system: "人数不足，课程已自动取消",
  completed: "已完成",
};
const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
function shanghaiToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function addDays(date: string, offset: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10);
}
function weekday(date: string) {
  return weekdays[new Date(`${date}T12:00:00Z`).getUTCDay()];
}
function isPastCancellationCutoff(schedule: any) {
  return Boolean(schedule?.cancellationCutoffAt && Date.now() >= Date.parse(schedule.cancellationCutoffAt));
}
function Login({ done }: any) {
  const [u, su] = useState(""),
    [p, sp] = useState(""),
    [e, se] = useState("");
  async function go(x: FormEvent) {
    x.preventDefault();
    try {
      let r = await api("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: u, password: p }),
      });
      session.token = r.token;
      done(r.user);
    } catch (x) {
      se((x as Error).message);
    }
  }
  return (
    <main className="login">
      <section>
        <img className="login-logo" src={logo} alt="本觉剧场 Awareness Theatre" />
        <h1>舞蹈课程管理</h1>
        <p>课程安排、预约与课卡管理</p>
      </section>
      <form onSubmit={go}>
        <label>
          用户名（手机号码）
          <input placeholder="请输入手机号码" inputMode="tel" autoComplete="username" value={u} onChange={(x) => su(x.target.value)} required />
        </label>
        <label>
          登录密码
          <input
            type="password"
            placeholder="请输入密码"
            autoComplete="current-password"
            value={p}
            onChange={(x) => sp(x.target.value)}
            required
          />
        </label>
        {e && <p className="error">{e}</p>}
        <button>登录</button>
      </form>
    </main>
  );
}
function StudentForm({ back, refresh }: any) {
  let [f, setF] = useState<any>({
    name: "",
    username: "",
    phone: "",
    purchasedAt: "",
    expiresAt: "",
    cardType: "times",
    remainingLessons: 8,
    avatarKey: "ballet",
    password: "",
  });
  let [credential, setCredential] = useState<any>(null), [copied, setCopied] = useState(false);
  let set = (k: string, v: any) => setF({ ...f, [k]: v });
  async function go(e: FormEvent) {
    e.preventDefault();
    try {
      let r = await api("/v1/students", {
        method: "POST",
        body: JSON.stringify({ ...f, password: f.password || undefined }),
      });
      refresh();
      setCredential({
        username: r.username,
        password: f.password || r.temporaryPassword,
      });
    } catch (x) {
      alert((x as Error).message);
    }
  }
  if (credential)
    return (
      <Page title="学生已创建" back={back}>
        <section className="credential panel">
          <div className="credential-success">
            <span>✓</span>
            <div>
              <h2>学生账号已创建</h2>
              <p>请将登录信息发送给学生。</p>
            </div>
          </div>
          <div className="credential-warning">请先复制或截图保存。离开此页后，初始密码将不再显示；需要时可由老师重置。</div>
          <div className="credential-values">
            <div><small>登录用户名</small><strong>{credential.username}</strong></div>
            <div><small>初始密码</small><strong>{credential.password}</strong></div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const text = `用户名：${credential.username}\n密码：${credential.password}`;
              try { await navigator.clipboard.writeText(text); setCopied(true); }
              catch { prompt("请复制以下登录信息", text); }
            }}
          >
            {copied ? "已复制登录信息" : "复制账号和密码"}
          </button>
          <button type="button" className="outline" onClick={back}>
            完成
          </button>
        </section>
      </Page>
    );
  return (
    <Page title="添加学生" back={back}>
      <form className="form" onSubmit={go}>
        <Field label="选择头像">
          <div className="avatars">
            {avatars.map(([k, i]) => (
              <button
                type="button"
                className={f.avatarKey === k ? "selected" : ""}
                onClick={() => set("avatarKey", k)}
                key={k}
              >
                {i}
              </button>
            ))}
          </div>
        </Field>
        <Field label="学生姓名">
          <input
            placeholder="请输入姓名"
            value={f.name}
            onChange={(x) => set("name", x.target.value)}
            required
          />
        </Field>
        <Field label="用户名（手机号码）">
          <input
            inputMode="numeric"
            placeholder="请输入手机号码"
            value={f.username}
            onChange={(x) =>
              setF({ ...f, username: x.target.value, phone: x.target.value })
            }
            required
          />
        </Field>
        <Field label="课程开卡时间">
          <input
            type="date"
            value={f.purchasedAt}
            onChange={(x) => set("purchasedAt", x.target.value)}
            required
          />
        </Field>
        <Field label="课卡类别">
          <div className="choices">
            {Object.entries(cards).map(([k, v]) => (
              <button
                type="button"
                className={f.cardType === k ? "selected" : ""}
                onClick={() => set("cardType", k)}
                key={k}
              >
                {v as string}
              </button>
            ))}
          </div>
        </Field>
        {f.cardType === "times" && (
          <Field label="初始剩余课时">
            <input
              type="number"
              min="0"
              value={f.remainingLessons}
              onChange={(x) => set("remainingLessons", +x.target.value)}
              required
            />
          </Field>
        )}
        <Field label="课程有效期">
          <input
            type="date"
            value={f.expiresAt}
            onChange={(x) => set("expiresAt", x.target.value)}
            required
          />
        </Field>
        <Field label="初始密码（留空自动生成）">
          <input
            minLength={8}
            placeholder="自动生成安全密码"
            value={f.password}
            onChange={(x) => set("password", x.target.value)}
          />
        </Field>
        <button>创建并生成登录信息</button>
      </form>
    </Page>
  );
}
function ScheduleForm({ back, refresh, schedule }: any) {
  let [f, sf] = useState<any>({
    classType: "daily",
    courseName: "素质训练",
    allowBooking: true,
    date: "",
    startTime: "",
    duration: 60,
    minStudents: 4,
    capacity: 18,
    ...(schedule || {}),
  }), [newCourseName, setNewCourseName] = useState(schedule && !courses[schedule.classType]?.some((course: any) => course[0] === schedule.courseName) ? schedule.courseName : "");
  let set = (k: string, v: any) => sf({ ...f, [k]: v });
  let list = courses[f.classType];
  function type(t: string) {
    sf({
      ...f,
      classType: t,
      allowBooking: t === "daily",
      courseName: courses[t][0][0],
      duration: courses[t][0][1],
    });
    setNewCourseName("");
  }
  async function go(e: FormEvent) {
    e.preventDefault();
    const courseName = newCourseName.trim() || f.courseName.trim();
    if (!courseName) {
      alert("请选择或填写课程名称");
      return;
    }
    try {
      await api(schedule ? `/v1/schedules/${schedule.scheduleId}` : "/v1/schedules", { method: schedule ? "PUT" : "POST", body: JSON.stringify({ ...f, courseName }) });
      refresh();
      back();
    } catch (x) {
      alert((x as Error).message);
    }
  }
  return (
    <Page title={schedule ? "编辑已发布课程" : "发布可预约时间"} back={back}>
      <form className="form" onSubmit={go}>
        <Field label="课程类型">
          <div className="twos">
            <button
              type="button"
              className={f.classType === "daily" ? "selected" : ""}
              onClick={() => type("daily")}
            >
              成人日常课
            </button>
            <button
              type="button"
              className={f.classType === "custom" ? "selected" : ""}
              onClick={() => type("custom")}
            >
              定制课
            </button>
          </div>
        </Field>
        {f.classType === "custom" && (
          <Field label="开放学生预约">
            <input
              className="switch"
              type="checkbox"
              checked={f.allowBooking}
              onChange={(x) => set("allowBooking", x.target.checked)}
            />
          </Field>
        )}
        <Field label="常用课程">
          <select
            value={f.courseName}
            onChange={(x) => {
              let c = list.find((z: any) => z[0] === x.target.value);
              sf({
                ...f,
                courseName: x.target.value,
                duration: c?.[1] || f.duration,
              });
              setNewCourseName("");
            }}
          >
            {list.map((c: any) => (
              <option key={c[0]} value={c[0]}>
                {c[0]} · {c[1]} 分钟
              </option>
            ))}
          </select>
        </Field>
        <Field label="添加新的课程名称（可选）">
          <input
            value={newCourseName}
            maxLength={30}
            placeholder="例如：舞台表现力训练"
            onChange={(x) => {
              const value = x.target.value;
              setNewCourseName(value);
            }}
          />
          <small className="field-note">填写后将使用该名称；下拉菜单仍可用于选择常用课程。</small>
        </Field>
        <Field label="日期">
          <input
            type="date"
            value={f.date}
            onChange={(x) => set("date", x.target.value)}
            required
          />
        </Field>
        <Field label="开始时间">
          <input
            type="time"
            value={f.startTime}
            onChange={(x) => set("startTime", x.target.value)}
            required
          />
        </Field>
        <Field label="时长（分钟）">
          <input
            type="number"
            min="15"
            max="360"
            value={f.duration}
            onChange={(x) => set("duration", +x.target.value)}
            required
          />
        </Field>
        {(f.classType === "daily" || f.allowBooking) && (
          <>
            <Field label="最少开课人数">
              <input
                type="number"
                min="4"
                max="18"
                value={f.minStudents}
                onChange={(x) => set("minStudents", +x.target.value)}
              />
            </Field>
            <Field label="最多预约学生数（不超过 18 人）">
              <input
                type="number"
                min="4"
                max="18"
                value={f.capacity}
                onChange={(x) => set("capacity", +x.target.value)}
              />
            </Field>
          </>
        )}
        <button>{schedule ? "保存修改" : "发布"}</button>
      </form>
    </Page>
  );
}
function Field({ label, children }: any) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}
function Page({ title, back, children }: any) {
  return (
    <main className="page">
      <header>
        <button onClick={back}>‹</button>
        {title}
      </header>
      {children}
    </main>
  );
}
function PasswordForm({ back }: { back: () => void }) {
  const [currentPassword, setCurrentPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }
    try {
      await api("/v1/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      alert("密码已修改，请牢记新密码。");
      back();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }
  return (
    <Page title="修改密码" back={back}>
      <form className="form panel password-form" onSubmit={submit}>
        <p className="password-hint">为保障账号安全，新密码至少 8 位。</p>
        <Field label="当前密码"><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></Field>
        <Field label="新密码"><input type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></Field>
        <Field label="确认新密码"><input type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></Field>
        {error && <p className="error">{error}</p>}
        <button>保存新密码</button>
        <p className="password-hint">忘记密码的学生请联系所属老师重置；老师请联系管理员。</p>
      </form>
    </Page>
  );
}
function Teacher() {
  let [t, st] = useState("today"),
    [screen, ss] = useState("home"),
    [editing, setEditing] = useState<any>(null),
    [selectedStudent, setSelectedStudent] = useState<any>(null),
    [selectedDate, setSelectedDate] = useState(shanghaiToday()),
    [data, sd] = useState<any>({
      students: [],
      schedules: [],
      appointments: [],
    });
  let load = () =>
    Promise.all([
      api("/v1/students"),
      api("/v1/schedules"),
      api("/v1/appointments"),
    ]).then(([students, schedules, appointments]) =>
      sd({ students, schedules, appointments }),
    );
  useEffect(() => {
    load();
  }, []);
  if (screen === "student")
    return <StudentForm back={() => ss("home")} refresh={load} />;
  if (screen === "schedule")
    return <ScheduleForm back={() => ss("home")} refresh={load} schedule={editing} />;
  if (screen === "student-detail")
    return <StudentDetail student={selectedStudent} appointments={data.appointments} back={() => ss("home")} />;
  let { students, schedules, appointments } = data;
  async function resetPassword(studentId: string) {
    if (!confirm("重置后，学生需使用新的临时密码登录。确认继续？")) return;
    try {
      const result = await api(`/v1/students/${studentId}/reset-password`, {
        method: "POST",
      });
      prompt(
        "请复制并发送给学生（密码仅显示这一次）",
        `用户名：${result.username}\n密码：${result.temporaryPassword}`,
      );
    } catch (error) {
      alert((error as Error).message);
    }
  }
  async function setAppointmentStatus(appointmentId: string, status: string) {
    const label =
      status === "confirmed"
        ? "确认预约"
        : status === "completed"
          ? "确认已完成并扣除一次课时"
          : "取消该预约并释放名额";
    if (!confirm(`${label}？`)) return;
    try {
      await api(`/v1/appointments/${appointmentId}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (error) {
      alert((error as Error).message);
    }
  }
  async function cancelCourse(schedule: any) {
    if (!confirm(`确认取消「${schedule.courseName}」吗？所有已预约学生将收到课程取消状态，名额会被释放。`)) return;
    try {
      await api(`/v1/schedules/${schedule.scheduleId}/cancel`, { method: "POST" });
      load();
    } catch (error) {
      alert((error as Error).message);
    }
  }
  return (
    <main className="page">
      <header>老师工作台</header>
      <nav>
        {[
          ["today", "今日"],
          ["schedules", "排课"],
          ["appointments", "预约"],
          ["students", "学生"],
        ].map(([k, v]) => (
          <button
            className={t === k ? "active" : ""}
            onClick={() => st(k)}
            key={k}
          >
            {v}
          </button>
        ))}
      </nav>
      {t === "today" && (
        <>
          <div className="summary">
            {[
              [students.length, "学生"],
              [
                schedules.filter(
                  (s: any) => s.date === shanghaiToday(),
                ).length,
                "今日课程",
              ],
              [
                appointments.filter((a: any) => a.status === "pending").length,
                "待确认",
              ],
            ].map((x) => (
              <article key={String(x[1])}>
                <b>{x[0]}</b>
                <span>{x[1]}</span>
              </article>
            ))}
          </div>
          <section className="section">
            <h2>课程安排</h2>
            <div className="days">
              {Array.from({ length: 7 }, (_, offset) => {
                const date = addDays(shanghaiToday(), offset);
                return (
                  <button
                    key={date}
                    className={selectedDate === date ? "active" : ""}
                    onClick={() => setSelectedDate(date)}
                  >
                    周
                    {weekday(date)}
                    <br />
                    {date.slice(5).replace("-", "/")}
                  </button>
                );
              })}
            </div>
            <label className="date-picker">
              <span>选择其他日期</span>
              <input type="date" min={shanghaiToday()} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </label>
            <div className="selected-day">查看 <strong>{selectedDate} · 周{weekday(selectedDate)}</strong> 的课程</div>
            <div className="panel">
              {schedules
                .filter((schedule: any) => schedule.date === selectedDate)
                .map((schedule: any) => (
                  <article className="row" key={schedule.scheduleId}>
                    <div className="course-row-title">
                      <b>
                        {schedule.startTime} · {schedule.courseName}
                      </b>
                      {schedule.status === "open" && (
                        <div className="course-row-actions">
                          <button className="outline compact-edit" onClick={() => { setEditing(schedule); ss("schedule"); }}>编辑</button>
                          <button className="outline danger compact-edit" onClick={() => cancelCourse(schedule)}>取消</button>
                        </div>
                      )}
                    </div>
                    {["cancelled_by_system", "cancelled_by_teacher"].includes(schedule.status) ? (
                      <p className="course-cancelled">
                        {schedule.status === "cancelled_by_system" ? "人数不足，课程已自动取消" : "课程已由老师取消"}
                      </p>
                    ) : (
                      <p>
                        {schedule.classType === "custom"
                          ? "定制课"
                          : "成人日常课"}{" "}
                        · 已预约 {schedule.bookedCount}/{schedule.capacity} 人
                      </p>
                    )}
                    {appointments
                      .filter(
                        (appointment: any) =>
                          appointment.scheduleId === schedule.scheduleId,
                      )
                      .map((appointment: any) => (
                        <small key={appointment.appointmentId}>
                          {students.find(
                            (student: any) =>
                              student.studentId === appointment.studentId,
                          )?.name || "学生"}{" "}
                          ·{" "}
                          {appointment.status === "confirmed"
                            ? "已确认"
                            : appointment.status === "pending"
                              ? "待确认"
                              : appointment.status}
                        </small>
                      ))}
                  </article>
                ))}
              {!schedules.some(
                (schedule: any) => schedule.date === selectedDate,
              ) && <p className="empty">这一天没有课程安排。</p>}
            </div>
          </section>
        </>
      )}
      {t === "schedules" && (
        <List
          title="已发布可预约时间"
          add="发布课程"
          click={() => { setEditing(null); ss("schedule"); }}
          items={schedules}
          render={(s: any) => (
            <>
              <b>{s.courseName}</b>
              <p>
                {s.date} {s.startTime} ·{" "}
                {s.classType === "custom" ? "定制课" : "成人日常课"} ·{" "}
                {s.duration} 分钟
              </p>
              <small className={["cancelled_by_system", "cancelled_by_teacher"].includes(s.status) ? "course-cancelled" : ""}>
                {s.status === "cancelled_by_system"
                  ? "人数不足，课程已自动取消"
                  : s.status === "cancelled_by_teacher"
                    ? "课程已由老师取消"
                  : s.allowBooking
                    ? `已预约 ${s.bookedCount}/${s.capacity} 人`
                    : "仅展示"}
              </small>
              {s.status === "open" && <div className="course-list-actions"><button className="outline" onClick={() => { setEditing(s); ss("schedule"); }}>编辑课程</button><button className="outline danger" onClick={() => cancelCourse(s)}>取消课程</button></div>}
            </>
          )}
        />
      )}{" "}
      {t === "students" && (
        <StudentManager
          students={students}
          add={() => ss("student")}
          detail={(student: any) => { setSelectedStudent(student); ss("student-detail"); }}
          resetPassword={resetPassword}
        />
      )}{" "}
      {t === "appointments" && (
        <AppointmentManager
          appointments={appointments}
          schedules={schedules}
          students={students}
          setStatus={setAppointmentStatus}
        />
      )}
    </main>
  );
}
function StudentManager({ students, add, detail, resetPassword }: any) {
  const [tab, setTab] = useState("active");
  const today = shanghaiToday();
  const usable = (student: any) => student.expiresAt >= today && (student.cardType !== "times" || Number(student.remainingLessons) > 0);
  const active = students.filter(usable);
  const inactive = students.filter((student: any) => !usable(student));
  const items = tab === "active" ? active : inactive;
  const reason = (student: any) => {
    const expired = student.expiresAt < today;
    const exhausted = student.cardType === "times" && Number(student.remainingLessons) <= 0;
    return expired && exhausted ? "已过期 · 课时已用完" : expired ? "课卡已过期" : "课时已用完";
  };
  return (
    <section className="section student-manager">
      <div className="heading"><h2>学生课时</h2><button className="outline" onClick={add}>添加学生</button></div>
      <div className="appointment-tabs student-tabs">
        <button className={tab === "active" ? "active" : ""} onClick={() => setTab("active")}>正常学生<small>{active.length}</small></button>
        <button className={tab === "inactive" ? "active" : ""} onClick={() => setTab("inactive")}>已过期／用完<small>{inactive.length}</small></button>
      </div>
      <div className="panel student-list">
        {items.length ? items.map((student: any) => (
          <article className="row" key={student.studentId}>
            <b>{student.name}</b>
            <p>{cards[student.cardType]} · {student.cardType === "times" ? `剩余 ${student.remainingLessons} 课时 · ` : ""}有效期 {student.expiresAt}</p>
            <small className={tab === "inactive" ? "course-cancelled" : ""}>{tab === "inactive" ? reason(student) : student.username}</small>
            <div className="student-actions"><button className="outline" onClick={() => detail(student)}>详情</button><button className="outline" onClick={() => resetPassword(student.studentId)}>重置密码</button></div>
          </article>
        )) : <p className="empty">{tab === "active" ? "暂无正常学生。" : "暂无已过期或课时用完的学生。"}</p>}
      </div>
    </section>
  );
}
function StudentDetail({ student, appointments, back }: any) {
  const records = appointments.filter((item: any) => item.studentId === student.studentId);
  const active = records.filter((item: any) => ["pending", "booked", "confirmed"].includes(item.status)).sort((a: any, b: any) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  const completed = records.filter((item: any) => item.status === "completed").sort((a: any, b: any) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
  const otherHistory = records.filter((item: any) => !["pending", "booked", "confirmed", "completed"].includes(item.status)).sort((a: any, b: any) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
  const RecordList = ({ items, lesson }: any) => items.length ? <div className="panel">{items.map((item: any) => <article className="row" key={item.appointmentId}><b>{item.date} {item.startTime} · {item.courseName}</b><small>{lesson ? (student.cardType === "times" ? "已完成 · 扣除 1 课时" : "已完成") : appointmentStatus[item.status] || item.status}</small></article>)}</div> : <p className="empty">暂无记录。</p>;
  return (
    <Page title="学生详情" back={back}>
      <section className="student-profile panel">
        <h2>{student.name}</h2>
        <p>{student.username || student.phone}</p>
        <div className="student-stats">
          <span><b>{student.cardType === "times" ? student.remainingLessons : "—"}</b>剩余课时</span>
          <span><b>{completed.length}</b>累计完成</span>
          <span><b>{records.length}</b>累计预约</span>
        </div>
        <small>{cards[student.cardType]} · 课程开卡时间 {student.purchasedAt} · 有效期至 {student.expiresAt}</small>
      </section>
      <section className="section"><div className="heading"><h2>待处理与即将上课</h2><span>{active.length}</span></div><RecordList items={active} /></section>
      <section className="section"><div className="heading"><h2>课时记录</h2><span>{completed.length}</span></div><RecordList items={completed} lesson /></section>
      <section className="section"><div className="heading"><h2>取消记录</h2><span>{otherHistory.length}</span></div><RecordList items={otherHistory} /></section>
    </Page>
  );
}
function AppointmentManager({ appointments, schedules, students, setStatus }: any) {
  const [tab, setTab] = useState("pending");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const today = shanghaiToday();
  const courseFor = (appointment: any) => schedules.find((schedule: any) => schedule.scheduleId === appointment.scheduleId);
  const kind = (appointment: any) => {
    if (appointment.status === "pending" || appointment.status === "booked") return "pending";
    const course = courseFor(appointment);
    return appointment.status === "confirmed" && (!course || course.status === "open") ? "upcoming" : "history";
  };
  const labels: any = { pending: "待处理", upcoming: "即将上课", history: "历史记录" };
  const counts = ["pending", "upcoming", "history"].reduce((result: any, key) => ({ ...result, [key]: appointments.filter((item: any) => kind(item) === key).length }), {});
  const oldestHistoryDate = addDays(today, -30);
  const visible = appointments
    .filter((item: any) => kind(item) === tab)
    .filter((item: any) => tab !== "history" || showAllHistory || item.date >= oldestHistoryDate)
    .sort((a: any, b: any) => (tab === "history" ? -1 : 1) * `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  const groups = visible.reduce((result: any, item: any) => {
    (result[item.date] ||= []).push(item);
    return result;
  }, {});
  return (
    <section className="section appointment-manager">
      <div className="heading"><h2>预约管理</h2></div>
      <div className="appointment-tabs">
        {Object.entries(labels).map(([key, label]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{String(label)}<small>{counts[key]}</small></button>
        ))}
      </div>
      {Object.entries(groups).map(([date, items]: any) => (
        <section className="appointment-date-group" key={date}>
          <h3>{date === today ? "今天" : `${date} · 周${weekday(date)}`}</h3>
          <div className="panel">
            {items.map((a: any) => (
              <article className="row appointment-row" key={a.appointmentId}>
                <b>{a.startTime} · {a.courseName}</b>
                {(() => {
                  const student = students.find((item: any) => item.studentId === a.studentId);
                  return <small className="appointment-student">{student ? `${student.name} · ${student.phone || student.username}` : "学生资料已删除"}</small>;
                })()}
                <p>{appointmentStatus[a.status] || a.status}</p>
                {(a.status === "pending" || a.status === "booked") && <div className="actions"><button className="outline" onClick={() => setStatus(a.appointmentId, "confirmed")}>确认预约</button><button className="outline danger" onClick={() => setStatus(a.appointmentId, "cancelled_by_teacher")}>取消</button></div>}
                {a.status === "confirmed" && <div className="actions"><button className="outline" onClick={() => setStatus(a.appointmentId, "completed")}>完成并扣课时</button><button className="outline danger" onClick={() => setStatus(a.appointmentId, "cancelled_by_teacher")}>取消</button></div>}
              </article>
            ))}
          </div>
        </section>
      ))}
      {!visible.length && <p className="empty">{tab === "history" ? "最近 30 天暂无历史记录。" : `暂无${labels[tab]}预约。`}</p>}
      {tab === "history" && !showAllHistory && counts.history > visible.length && <button className="history-more" onClick={() => setShowAllHistory(true)}>查看全部历史记录</button>}
    </section>
  );
}
function List({ title, add, click, items, render }: any) {
  return (
    <section className="section">
      <div className="heading">
        <h2>{title}</h2>
        {add && (
          <button className="outline" onClick={click}>
            {add}
          </button>
        )}
      </div>
      <div className="panel">
        {items.length ? (
          items.map((x: any) => (
            <article
              className="row"
              key={x.studentId || x.scheduleId || x.appointmentId}
            >
              {render(x)}
            </article>
          ))
        ) : (
          <p className="empty">暂无记录。</p>
        )}
      </div>
    </section>
  );
}
function Student() {
  let [p, sp] = useState<any>(),
    [s, ss] = useState<any[]>([]),
    [appointments, setAppointments] = useState<any[]>([]),
    [kind, sk] = useState("daily"),
    [day, sd] = useState(shanghaiToday()),
    [appointmentTab, setAppointmentTab] = useState("upcoming");
  useEffect(() => {
    Promise.all([
      api("/v1/students/me"),
      api("/v1/schedules"),
      api("/v1/appointments"),
    ]).then(([p, s, appointments]) => {
      sp(p);
      ss(s);
      setAppointments(appointments);
    });
  }, []);
  if (!p) return <main className="page">正在加载你的课程...</main>;
  let days = Array.from({ length: 7 }, (_, i) => addDays(shanghaiToday(), i)),
    visible = s.filter(
      (x) =>
        x.status === "open" &&
        x.classType === kind &&
        (kind === "custom" || x.date === day),
    );
  const cardExpired = p.expiresAt < shanghaiToday();
  const lessonsExhausted = p.cardType === "times" && Number(p.remainingLessons) <= 0;
  const accountUnavailable = cardExpired || lessonsExhausted;
  const expiryDays = Math.floor((Date.parse(`${p.expiresAt}T00:00:00Z`) - Date.parse(`${shanghaiToday()}T00:00:00Z`)) / 86_400_000);
  const cardExpiringSoon = !cardExpired && expiryDays <= 30;
  const lessonsLow = p.cardType === "times" && Number(p.remainingLessons) > 0 && Number(p.remainingLessons) < 2;
  const accountMessage = cardExpired && lessonsExhausted
    ? "你的课程卡已过期，且次卡课时已用完。请联系老师续卡或补充课时后再预约。"
    : cardExpired
      ? "你的课程卡已过期。请联系老师续卡后再预约课程。"
      : "你的次卡课时已用完。请联系老师补充课时后再预约课程。";
  const upcomingAppointments = appointments.filter((appointment) => ["pending", "booked", "confirmed"].includes(appointment.status)).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  const historyAppointments = appointments.filter((appointment) => !["pending", "booked", "confirmed"].includes(appointment.status)).sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
  const shownAppointments = appointmentTab === "upcoming" ? upcomingAppointments : historyAppointments;
  return (
    <main className="page">
      <header>我的课程</header>
      <section className="panel profile">
        <div>🩰</div>
        <b>{p.name}</b>
        <p>
          {cards[p.cardType]} · 有效期至 {p.expiresAt}
        </p>
        {p.cardType === "times" && (
          <strong>剩余 {p.remainingLessons} 课时</strong>
        )}
      </section>
      {accountUnavailable && (
        <section className="account-alert" role="alert">
          <span>!</span>
          <div><b>暂时无法预约新课程</b><p>{accountMessage}</p></div>
        </section>
      )}
      {!accountUnavailable && (cardExpiringSoon || lessonsLow) && (
        <section className="account-alert reminder" role="status">
          <span>!</span>
          <div>
            <b>课程卡温馨提醒</b>
            <p>{cardExpiringSoon && lessonsLow ? `课程卡将在 ${expiryDays} 天后到期，目前仅剩 ${p.remainingLessons} 课时。建议提前联系老师续卡或补充课时。` : cardExpiringSoon ? `课程卡将在 ${expiryDays} 天后到期，建议提前联系老师续卡。` : `目前仅剩 ${p.remainingLessons} 课时，建议提前联系老师补充课时。`}</p>
          </div>
        </section>
      )}
      <section className="section">
        <div className="tabs">
          <button
            className={kind === "daily" ? "active" : ""}
            onClick={() => sk("daily")}
          >
            成人日常课
          </button>
          <button
            className={kind === "custom" ? "active" : ""}
            onClick={() => sk("custom")}
          >
            定制课
          </button>
        </div>
        {kind === "daily" && (
          <>
            <div className="days">
              {days.map((d) => (
                <button
                  className={day === d ? "active" : ""}
                  onClick={() => sd(d)}
                  key={d}
                >
                  周
                  {weekday(d)}
                  <br />
                  {d.slice(5).replace("-", "/")}
                </button>
              ))}
            </div>
            <label className="date-picker">
              <span>选择其他日期</span>
              <input type="date" min={shanghaiToday()} value={day} onChange={(event) => sd(event.target.value)} />
            </label>
          </>
        )}
        <div className="slots">
          {visible.map((x) => {
            const activeAppointment = appointments.find(
              (appointment) =>
                appointment.scheduleId === x.scheduleId &&
                ["pending", "confirmed"].includes(appointment.status),
            );
            const isBooked = Boolean(activeAppointment);
            const pastCutoff = isPastCancellationCutoff(x);
            return (
              <article className="panel slot" key={x.scheduleId}>
                <div>
                  <b>{x.courseName}</b>
                  <p>
                    {x.date} {x.startTime}
                  </p>
                  <small>
                    {x.duration} 分钟 · 剩余 {x.capacity - x.bookedCount} 人
                  </small>
                  <small className="rule-note">
                    {pastCutoff ? "已过预约截止时间" : "开课前 2 小时可免费取消"}
                  </small>
                </div>
                {isBooked ? (
                  <span className="booked">
                    ✓ {activeAppointment.status === "confirmed" ? "预约已确认" : "预约成功，待老师确认"}
                  </span>
                ) : (
                  <button
                    className="outline book-action"
                    disabled={accountUnavailable || !x.allowBooking || x.bookedCount >= x.capacity || pastCutoff}
                    onClick={async () => {
                      if (confirm("确认预约这个时间段？")) {
                        try {
                          await api(`/v1/schedules/${x.scheduleId}/book`, {
                            method: "POST",
                          });
                          location.reload();
                        } catch (e) {
                          alert((e as Error).message);
                        }
                      }
                    }}
                  >
                    {accountUnavailable ? "课程卡不可用" : "预约"}
                  </button>
                )}
              </article>
            );
          })}
          {!visible.length && <p className="empty">暂无可预约课程。</p>}
        </div>
      </section>
      <section className="section">
        <div className="heading"><h2>我的预约</h2></div>
        <div className="appointment-tabs student-appointment-tabs">
          <button className={appointmentTab === "upcoming" ? "active" : ""} onClick={() => setAppointmentTab("upcoming")}>待参加<small>{upcomingAppointments.length}</small></button>
          <button className={appointmentTab === "history" ? "active" : ""} onClick={() => setAppointmentTab("history")}>已完成／已取消<small>{historyAppointments.length}</small></button>
        </div>
        <div className="panel student-appointments">
          {shownAppointments.length ? (
            shownAppointments.map((appointment) => (
              <article className="row" key={appointment.appointmentId}>
                <b>
                  {appointment.date} {appointment.startTime} ·{" "}
                  {appointment.courseName}
                </b>
                <p>状态：{appointmentStatus[appointment.status] || appointment.status}</p>
                {["pending", "confirmed"].includes(appointment.status) && (() => {
                  const schedule = s.find((course) => course.scheduleId === appointment.scheduleId);
                  if (!schedule || schedule.status !== "open") {
                    return <small className="rule-note">课程已结束或已取消，预约不能取消</small>;
                  }
                  const pastCutoff = isPastCancellationCutoff(schedule);
                  return pastCutoff ? <small className="rule-note">已过开课前 2 小时取消截止时间</small> : <button className="outline danger cancel-action" onClick={async () => { if (!confirm("取消后会释放一个预约名额。")) return; try { await api(`/v1/appointments/${appointment.appointmentId}/cancel`, { method: "POST" }); location.reload(); } catch (error) { alert((error as Error).message); } }}>取消预约</button>;
                })()}
              </article>
            ))
          ) : (
            <p className="empty">{appointmentTab === "upcoming" ? "暂无待参加课程。" : "暂无已完成或已取消记录。"}</p>
          )}
        </div>
      </section>
    </main>
  );
}
function App() {
  let [u, su] = useState<any>(), [screen, setScreen] = useState("home");
  useEffect(() => {
    if (session.token)
      api("/v1/auth/me")
        .then(su)
        .catch(() => session.clear());
  }, []);
  useEffect(() => {
    if (u?.mustChangePassword) setScreen("password");
  }, [u]);
  return (
    <>
      {u && screen === "home" && (
        <div className="account-actions">
          <button className="account" onClick={() => setScreen("password")}>修改密码</button>
          <button className="logout" onClick={() => { session.clear(); su(null); }}>退出</button>
        </div>
      )}
      {!u ? (
        <Login done={su} />
      ) : screen === "password" ? (
        <PasswordForm back={() => setScreen("home")} />
      ) : u.role === "teacher" ? (
        <Teacher />
      ) : (
        <Student />
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
