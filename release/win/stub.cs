// RT面板 Windows 安装器存根
// 双击运行 → UAC 提权 → 从自身尾部解压安装载荷到临时目录 → 启动黑金主题 HTA 安装向导
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text;

class RTSetup
{
    static readonly byte[] Marker = Encoding.ASCII.GetBytes("RTPAYLOAD1");

    static void Main()
    {
        string exePath = Assembly.GetExecutingAssembly().Location;
        try
        {
            string extractDir = Extract(exePath);
            string hta = Path.Combine(extractDir, "setup.hta");
            if (File.Exists(hta))
            {
                Process.Start(new ProcessStartInfo("mshta.exe", "\"" + hta + "\"") { UseShellExecute = true });
                return;
            }
            // 回退：直接静默安装
            string ps = Path.Combine(extractDir, "install-core.ps1");
            if (File.Exists(ps))
            {
                Process.Start(new ProcessStartInfo("powershell.exe",
                    "-NoProfile -ExecutionPolicy Bypass -File \"" + ps + "\"") { UseShellExecute = true });
            }
        }
        catch (Exception)
        {
            // 静默失败时弹出提示
        }
    }

    static string Extract(string exePath)
    {
        byte[] exe = File.ReadAllBytes(exePath);
        int marker = FindMarker(exe);
        if (marker < 0) throw new Exception("payload not found");
        int pos = marker + Marker.Length;

        string dir = Path.Combine(Path.GetTempPath(), "RTSetup");
        if (Directory.Exists(dir)) TryDelete(dir);
        Directory.CreateDirectory(dir);

        using (var ms = new MemoryStream(exe))
        {
            ms.Position = pos;
            using (var br = new BinaryReader(ms))
            {
                int count = br.ReadInt32();
                for (int i = 0; i < count; i++)
                {
                    int nameLen = br.ReadInt32();
                    byte[] nameBytes = br.ReadBytes(nameLen);
                    string relPath = Encoding.UTF8.GetString(nameBytes);
                    long dataLen = br.ReadInt64();
                    byte[] data = br.ReadBytes((int)dataLen);
                    string target = Path.Combine(dir, relPath);
                    string targetDir = Path.GetDirectoryName(target);
                    if (!string.IsNullOrEmpty(targetDir)) Directory.CreateDirectory(targetDir);
                    File.WriteAllBytes(target, data);
                }
            }
        }
        return dir;
    }

    static int FindMarker(byte[] haystack)
    {
        for (int i = haystack.Length - Marker.Length - 8 - 1024 * 1024; i >= 0 && i < haystack.Length - Marker.Length; i++)
        {
            bool match = true;
            for (int j = 0; j < Marker.Length; j++)
            {
                if (haystack[i + j] != Marker[j]) { match = false; break; }
            }
            if (match) return i;
        }
        return -1;
    }

    static void TryDelete(string path)
    {
        try
        {
            Directory.Delete(path, true);
        }
        catch { }
    }
}
