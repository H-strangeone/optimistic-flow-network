
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title OptiFlo
 * @dev Layer 2 scaling solution using optimistic rollups
 */
contract OptiFlo {
    struct Batch {
        uint256 batchId;
        bytes32 transactionsRoot;
        uint256 timestamp;
        bool verified;
        bool finalized;
    }

    struct Transaction {
        address sender;
        address recipient;
        uint256 amount;
    }

    // Storage
    mapping(address => uint256) public balances;
    mapping(uint256 => Batch) public batches;
    uint256 public nextBatchId;
    uint256 public slashingPenalty = 0.05 ether;
    
    // Events
    event BatchSubmitted(uint256 indexed batchId, bytes32 transactionsRoot);
    event BatchVerified(uint256 indexed batchId);
    event FraudReported(uint256 indexed batchId, bytes32 fraudProof);
    event FundsDeposited(address indexed user, uint256 amount);
    event FundsWithdrawn(address indexed user, uint256 amount);
    event FraudPenaltyApplied(address indexed user, uint256 penalty);
    event BatchFinalized(uint256 indexed batchId);

    // Modifiers
    modifier batchExists(uint256 _batchId) {
        require(_batchId < nextBatchId, "Batch does not exist");
        _;
    }

    // Constructor
    constructor() {
        nextBatchId = 1;
    }

    /**
     * @dev Submit a new batch of transactions
     * @param _transactionsRoots Array of Merkle roots representing transaction batches
     */
    function submitBatch(bytes32[] memory _transactionsRoots) external {
        require(_transactionsRoots.length > 0, "Batch must contain transactions");
        for (uint256 i = 0; i < _transactionsRoots.length; i++) {
            batches[nextBatchId] = Batch({
                batchId: nextBatchId,
                transactionsRoot: _transactionsRoots[i],
                timestamp: block.timestamp,
                verified: false,
                finalized: false
            });
            
            emit BatchSubmitted(nextBatchId, _transactionsRoots[i]);
            nextBatchId++;
        }
    }

    /**
     * @dev Verify a submitted batch
     * @param _batchId The ID of the batch to verify
     */
    function verifyBatch(uint256 _batchId) external batchExists(_batchId) {
        require(!batches[_batchId].finalized, "Batch is finalized");
        require(!batches[_batchId].verified, "Batch already verified");
        
        batches[_batchId].verified = true;
        emit BatchVerified(_batchId);
    }

    /**
     * @dev Report fraud in a batch by providing a fraud proof
     * @param _batchId The ID of the fraudulent batch
     * @param _fraudProof The fraud proof hash
     * @param _tx The fraudulent transaction
     * @param _merkleProof The Merkle proof of the transaction in the batch
     */
    function reportFraud(
        uint256 _batchId, 
        bytes32 _fraudProof, 
        Transaction memory _tx, 
        bytes32[] memory _merkleProof
    ) external batchExists(_batchId) {
        require(!batches[_batchId].verified, "Cannot report fraud on a verified batch");
        require(!batches[_batchId].finalized, "Cannot report fraud on a finalized batch");

        bool fraudFound = detectFraud(_batchId, _fraudProof, _tx, _merkleProof);
        if (!fraudFound) {
            require(balances[msg.sender] >= slashingPenalty, "Insufficient balance for penalty");
            balances[msg.sender] -= slashingPenalty;
            emit FraudPenaltyApplied(msg.sender, slashingPenalty);
        } else {
            // Invalidate batch (simplified for demo)
            batches[_batchId].transactionsRoot = bytes32(0);
        }
        
        emit FraudReported(_batchId, _fraudProof);
    }

    /**
     * @dev Detect if fraud exists in a batch
     * @param _batchId The ID of the batch to check
     * @param _fraudProof The fraud proof hash
     * @param _tx The transaction to verify
     * @param _merkleProof The Merkle proof of the transaction
     * @return Whether fraud was detected
     */
    function detectFraud(
        uint256 _batchId, 
        bytes32 _fraudProof, 
        Transaction memory _tx, 
        bytes32[] memory _merkleProof
    ) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(_tx.sender, _tx.recipient, _tx.amount));
        bytes32 root = batches[_batchId].transactionsRoot;
        return verifyMerkleProof(leaf, _merkleProof, root) && _fraudProof != leaf; // Fraud if proof doesn't match expected tx
    }

    /**
     * @dev Verify a Merkle proof
     * @param leaf The leaf node to verify
     * @param proof The Merkle proof
     * @param root The Merkle root
     * @return Whether the proof is valid
     */
    function verifyMerkleProof(
        bytes32 leaf, 
        bytes32[] memory proof, 
        bytes32 root
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            computedHash = computedHash < proofElement ? 
                keccak256(abi.encodePacked(computedHash, proofElement)) : 
                keccak256(abi.encodePacked(proofElement, computedHash));
        }
        return computedHash == root;
    }

    /**
     * @dev Finalize a batch after the challenge period
     * @param _batchId The ID of the batch to finalize
     */
    function finalizeBatch(uint256 _batchId) external batchExists(_batchId) {
        require(!batches[_batchId].finalized, "Batch already finalized");
        require(block.timestamp > batches[_batchId].timestamp + 1 weeks, "Challenge period not over");
        
        batches[_batchId].finalized = true;
        emit BatchFinalized(_batchId);
    }

    /**
     * @dev Deposit funds to the Layer 2 solution
     */
    function depositFunds() external payable {
        require(msg.value > 0, "Deposit must be greater than zero");
        balances[msg.sender] += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw funds from the Layer 2 solution
     * @param _amount The amount to withdraw
     */
    function withdrawFunds(uint256 _amount) external {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        balances[msg.sender] -= _amount;
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(msg.sender, _amount);
    }
    
    /**
     * @dev Transfer ETH to multiple recipients in a single transaction
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to transfer
     */
    function batchTransfer(address[] memory recipients, uint256[] memory amounts) external payable {
        require(recipients.length == amounts.length, "Mismatched arrays");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(msg.value >= totalAmount, "Insufficient ETH sent");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            (bool success, ) = payable(recipients[i]).call{value: amounts[i]}("");
            require(success, "Transfer failed");
        }
    }
    
    /**
     * @dev Fallback function to receive ETH
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}
