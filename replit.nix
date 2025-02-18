{pkgs}: {
  deps = [
    pkgs.cargo
    pkgs.rustc
    pkgs.glibcLocales
    pkgs.stockfish
    pkgs.postgresql
  ];
}
