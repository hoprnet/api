{ pkgs ? import <nixpkgs> { }, ... }:
let
  linuxPkgs = with pkgs; lib.optional stdenv.isLinux (
    inotifyTools
  );
  macosPkgs = with pkgs; lib.optional stdenv.isDarwin (
    with darwin.apple_sdk.frameworks; [
      # macOS file watcher support
      CoreFoundation
      CoreServices
    ]
  );
in
with pkgs;
mkShell {
  buildInputs = [
    ## base
    envsubst

    nodejs-18_x # v18.17.1
    (yarn.override { nodejs = nodejs-18_x; }) # v1.22.10

    # custom pkg groups
    macosPkgs
    linuxPkgs
  ];
}
