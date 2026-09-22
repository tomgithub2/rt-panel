// Created by 小杜 on 2026/08
// RT面板 Windows 安装器存根
// 双击运行 → UAC 提权 → 从自身尾部解压安装载荷到临时目录 → 启动黑金主题 HTA 安装向导
//
// 关于标记查找：载荷紧跟 PE 存根之后（约 6KB 处），不在文件尾部。
// 早期版本只从"末尾 1MB"往回找标记，5MB 的载荷让标记落在搜索窗口外，
// 结果双击后毫无反应（异常还被静默吞掉）。这里改成全文件倒序查找 + 头部校验。
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text;

class RTSetup
{
    static readonly byte[] Marker = Encoding.ASCII.GetBytes("RTPAYLOAD1");
    const int MAX_FILES = 100000;                  // 载荷文件数上限，用于排除误命中
    const long MAX_ENTRY = 512L * 1024 * 1024;     // 单文件上限，防止读到坏数据后 OOM

    static void Main(string[] args)
    {
        bool extractOnly = false;
        bool silent = false;
        foreach (string a in args)
        {
            if (a == "--extract-only") extractOnly = true;   // 自检用：只解压不弹向导
            else if (a == "--silent") silent = true;         // 静默安装（不弹向导）
        }

        string exePath = CurrentExePath();
        try
        {
            if (string.IsNullOrEmpty(exePath) || !File.Exists(exePath))
                throw new Exception("无法定位安装程序自身路径（exe=" + exePath + "）");

            string extractDir = Extract(exePath);

            if (extractOnly)
            {
                // 供打包自检调用：把结果写文件，winexe 没有控制台可打印
                try
                {
                    File.WriteAllText(Path.Combine(Path.GetTempPath(), "rt-extract-ok.txt"),
                        extractDir + "\r\n" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"), Encoding.UTF8);
                }
                catch { }
                return;
            }

            string ps = Path.Combine(extractDir, "install-core.ps1");
            string hta = Path.Combine(extractDir, "setup.hta");
            if (silent && File.Exists(ps))
            {
                Process.Start(new ProcessStartInfo("powershell.exe",
                    "-NoProfile -ExecutionPolicy Bypass -File \"" + ps + "\"") { UseShellExecute = true });
                return;
            }
            if (File.Exists(hta))
            {
                Process.Start(new ProcessStartInfo("mshta.exe", "\"" + hta + "\"") { UseShellExecute = true });
                return;
            }
            // 回退：没有 HTA 时直接静默安装
            if (File.Exists(ps))
            {
                Process.Start(new ProcessStartInfo("powershell.exe",
                    "-NoProfile -ExecutionPolicy Bypass -File \"" + ps + "\"") { UseShellExecute = true });
                return;
            }
            throw new Exception("安装载荷不完整（缺少 setup.hta / install-core.ps1）");
        }
        catch (Exception ex)
        {
            Report(ex, exePath);
        }
    }

    static string CurrentExePath()
    {
        try
        {
            string p = Assembly.GetExecutingAssembly().Location;
            if (!string.IsNullOrEmpty(p)) return p;
        }
        catch { }
        try { return Process.GetCurrentProcess().MainModule.FileName; } catch { }
        return null;
    }

    // 出错必须"看得见"：静默失败用户只会看到"双击没反应"，等于没法排查
    static void Report(Exception ex, string exePath)
    {
        string log = Path.Combine(Path.GetTempPath(), "rt-setup-error.txt");
        try
        {
            var sb = new StringBuilder();
            sb.AppendLine("RT面板 安装程序启动失败");
            sb.AppendLine("时间: " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            sb.AppendLine("程序: " + exePath);
            sb.AppendLine("错误: " + ex.Message);
            sb.AppendLine();
            sb.AppendLine(ex.ToString());
            sb.AppendLine();
            sb.AppendLine("请把本文件内容发给作者：QQ 3557529776 / xd8881313113@163.com");
            File.WriteAllText(log, sb.ToString(), Encoding.UTF8);
        }
        catch { }

        string msg = "RT面板 安装程序启动失败：\r\n\r\n" + ex.Message + "\r\n\r\n日志文件：" + log;
        try
        {
            System.Windows.Forms.MessageBox.Show(msg, "RT面板 安装程序",
                System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Error);
            return;
        }
        catch { }
        try { Process.Start("notepad.exe", "\"" + log + "\""); } catch { }
    }

    static string Extract(string exePath)
    {
        byte[] exe = File.ReadAllBytes(exePath);
        int marker = FindMarker(exe);
        if (marker < 0) throw new Exception("安装载荷未找到（文件可能被截断或被杀软改写，请重新下载）");
        int pos = marker + Marker.Length;

        string dir = Path.Combine(Path.GetTempPath(), "RTSetup");
        try
        {
            if (Directory.Exists(dir)) Directory.Delete(dir, true);
        }
        catch
        {
            // 上一轮的向导还开着时会占用文件，换个目录继续，不要因此安装失败
            dir = Path.Combine(Path.GetTempPath(), "RTSetup_" + DateTime.Now.Ticks.ToString("x"));
        }
        Directory.CreateDirectory(dir);

        using (var ms = new MemoryStream(exe))
        {
            ms.Position = pos;
            using (var br = new BinaryReader(ms))
            {
                int count = br.ReadInt32();
                if (count <= 0 || count > MAX_FILES)
                    throw new Exception("安装载荷头部损坏（文件数 " + count + "）");

                for (int i = 0; i < count; i++)
                {
                    if (ms.Position + 8 > ms.Length) throw new Exception("安装载荷在第 " + i + " 项处提前结束");
                    int nameLen = br.ReadInt32();
                    if (nameLen <= 0 || nameLen > 4096) throw new Exception("安装载荷文件名长度异常");
                    if (ms.Position + nameLen + 8 > ms.Length) throw new Exception("安装载荷在第 " + i + " 项处提前结束");

                    string relPath = Encoding.UTF8.GetString(br.ReadBytes(nameLen)).Replace('\\', '/').TrimStart('/');
                    if (relPath.Length == 0 || relPath.Contains(".."))
                        throw new Exception("安装载荷路径非法: " + relPath);

                    long dataLen = br.ReadInt64();
                    if (dataLen < 0 || dataLen > MAX_ENTRY)
                        throw new Exception("安装载荷大小异常: " + relPath + " (" + dataLen + ")");
                    byte[] data = br.ReadBytes((int)dataLen);
                    if (data.Length != (int)dataLen)
                        throw new Exception("安装载荷不完整: " + relPath);

                    string target = Path.Combine(dir, relPath.Replace('/', Path.DirectorySeparatorChar));
                    string targetDir = Path.GetDirectoryName(target);
                    if (!string.IsNullOrEmpty(targetDir)) Directory.CreateDirectory(targetDir);
                    File.WriteAllBytes(target, data);
                }
            }
        }
        return dir;
    }

    // 全文件倒序查找：载荷在文件前部，尾部搜索窗口根本覆盖不到（历史事故根因）
    static int FindMarker(byte[] data)
    {
        int limit = data.Length - Marker.Length;
        for (int i = limit; i >= 0; i--)
        {
            if (data[i] != Marker[0]) continue;
            bool match = true;
            for (int j = 1; j < Marker.Length; j++)
            {
                if (data[i + j] != Marker[j]) { match = false; break; }
            }
            if (!match) continue;

            // 标记后面跟着的文件数必须合理，否则视为载荷内容中的巧合字节串
            int countPos = i + Marker.Length;
            if (countPos + 4 > data.Length) continue;
            int count = BitConverter.ToInt32(data, countPos);
            if (count > 0 && count <= MAX_FILES) return i;
        }
        return -1;
    }
}
