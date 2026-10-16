# 初版转录记录 / Initial transcription record

这些文件保存初版的读谱数据和生成过程。发布总谱位于 `../scores/`；其中“核对 v1”单独维护，不能由本目录的初版脚本直接复现。

These files preserve the data and generation process of the initial transcription. The published score in `../scores/` is maintained separately; the initial scripts do not reproduce review v1.

- `score_data.py` → `score_data_08.py`：分批录入与修正记录 / successive data revisions.
- `transcription_v1.json`：初版结构化音符记录 / initial structured note data.
- `prepare_score.py`：数据检查及 JSON 整理 / data checks and JSON preparation.
- `export_score_v6.mjs`：初版两种结构的 GP 导出 / initial GP export in source and unfolded structures.
- `依存症_Intro4小节_试转.gp`：已确认的四小节模板 / confirmed four-measure template.

仅需要参考或重新运行初版导出时 / To inspect or rerun the historical initial exporter:

```sh
npm install
npm run prepare-library
node export_score_v6.mjs
```

Python 脚本只使用标准库；GP 导出依赖 alphaTab 1.8.4。脚本使用排他写入，新文件名已存在时会停止，不会静默覆盖。`prepare_score.py` 的目标 JSON 已随仓库提供；在本目录直接重跑会因文件存在而停止。

The Python scripts use the standard library. GP export uses alphaTab 1.8.4. Scripts create files exclusively and stop if their targets already exist. The JSON output of `prepare_score.py` is already included, so rerunning it here stops rather than overwriting that file.

alphaTab: https://github.com/CoderLine/alphaTab — a third-party dependency, distributed under its own license. No license for the original composition or published sheet music is granted by these tools.
