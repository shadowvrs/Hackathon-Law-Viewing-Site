{
  description = "A flake for my hackathon project";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { nixpkgs, ... }: let

    system = "x86_64-linux";
    pkgs = import nixpkgs { inherit system; };
  in {
    # NodeJs environment
    devShells.${system}.default = pkgs.mkShell {
      buildInputs = with pkgs; [
        nodejs
        yarn
        sqlite
        sqlitebrowser
      ];
    };
  };
}
