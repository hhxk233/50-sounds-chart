// 发布时不弹出控制台窗口（Windows）。
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    kana_trainer_lib::run()
}
