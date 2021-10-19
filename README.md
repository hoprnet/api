# HOPR API

A general purpose API for all HOPR related operations. Used for our CI/CD pipeline and other tasks.
## Endpoints
### Faucet

- https://api.hoprnet.org/api/faucet/xdai/balance/native/get          <-- get the current balance of the faucet
- https://api.hoprnet.org/api/faucet/xdai/$ethAddress/native/default  <-- funds the $address with 0.1291 xDAI

### Balance

- https://api.hoprnet.org/api/balance/xdai/$ethAddress/native/get             <-- get the balance of an $address
- https://api.hoprnet.org/api/balance/xdai/$ethAddress/native/get?text=true   <-- get the balance of an $address (plain text)

### Validate

- https://api.hoprnet.org/api/validate/$address/get                     <-- validate whether $address is a valid $ethAddress
- https://api.hoprnet.org/api/validate/$address/get?text=true           <-- validate whether $address is a valid $ethAddress (plain text)