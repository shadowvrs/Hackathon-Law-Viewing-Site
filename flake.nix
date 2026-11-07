{
  description = "A flake for my hackathon project";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { nixpkgs, ... }: {
    # NodeJs environment
    devShells.default = nixpkgs.legacyPackages.x86_64-linux.mkShell {
      buildInputs = [
        nixpkgs.legacyPackages.x86_64-linux.nodejs
        nixpkgs.legacyPackages.x86_64-linux.yarn
      ];
    };
  };
}
