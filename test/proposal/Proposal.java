package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 投保单
 */
public class Proposal extends Quotation implements Serializable {

    private static final long serialVersionUID = -5221654142744420216L;

    private String isFromInquiry;
    /**
     * 投保单状态
     */
    private String proposalStatusCd;

    @JsonFormat(
            pattern = "yyyy-MM-dd HH:mm:ss",
            timezone = "GMT+8"
    )
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    /**
     * 投保单生成日期
     */
    private LocalDateTime proposalCreateDt;

    @JsonFormat(
            pattern = "yyyy-MM-dd HH:mm:ss",
            timezone = "GMT+8"
    )
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)

    /**
     * 投保查询码有效期
     */
    private LocalDateTime queryNoDt;
    /**
     * 续保标识
     */
    private Integer renewalFlagCd;

    /**
     * 支付单号（订单号）
     */
    private String payOrderNo;

    /**
     * 支付流水号
     */
    private String paySerialNo;

    /**
     * 交易方式 trans_type_cd
     */
    private String transModeCd;

    /**
     * 是否发送短信验证码
     */
    private String isSmsVerification;

    /**
     * 发送验证码手机号
     */
    private String smsSendPhone;

    /**
     * 是否即时生效
     */
    private String isEffectiveImmediately;

    /**
     * 是否倒签单
     */
    private String isReserveSign;

    /**
     * 标的组
     */
    private List<SubjectGroupMG> subjectGroupMGList;

    /**
     * 缴费计划列表
     */
    private List<InstallmentMG> installmentMGList;

    /**
     * 支付方式
     */
    private String paymentModeCd;

    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime payCompleteTime;


    /**
     * 补登/退费失败原因
     */
    private String issueErrorMessage;

    /**
     * 投保查询号
     */
    private String querySequenceNo;

    /**
     * 验标任务号
     */
    private String verifySubjectTaskNo;


    /**
     * 电子签名标识，0-否，1-是
     */
    private String isElectronicSign;

    /**
     * 是否投保单模板
     */
    private String isTemplateProposal;

    /**
     * 模板投保单号
     */
    private String templateProposalNo;

    /**
     * 汇缴单位名称
     */
    private String remitUnitName;


    /**
     * 汇缴单位客户id
     */
    private String remitUnitCustomerId;

    /**
     * 是否发送双录链接
     */
    private String isSendDoubleRecordLink;
    /**
     * 是否已经完成双录
     */
    private String isCompleteDoubleRecord;

    /**
     * 是否上传身份信息
     */
    private String isUploadIdentityInfo;

    /**
     * 投保组织者（农险专有）
     */
    private ProposalOrganizerMG proposalOrganizerInfo;
    /**
     * 险种代码（农线特有）
     */
    private String productSubjectCode;
    /**
     * 险种名称（农线特有）
     */
    private String productSubjectName;
    /**
     * 标的地址（农险）
     */
    private List<String> subjectSmallCategoryCodeList;
    /**
     * 标的地址（农险）
     */
    private SubjectAddressMG subjectAddress;

    /**
     * 标的农险详细地址
     */
    private String subjectDetailAddress;

    /**
     * 是否生成电子保单（0否1是）
     */
    private String isGeneratePolicy;

    /**
     * 电子化标识（农险）
     */
    private String electronicFlag;

    /**
     * 录单模板id
     */
    private String templateCode;

    /**
     * 兴农保关联订单号
     */
    public String orderNoXNB;

    /**
     * 承保数量
     */
    private BigDecimal insuredQuantity;

    /**
     * 农户数
     */
    private BigDecimal farmerQuantity;

    /**
     *核保完成时间
     */
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime underwritingEndDt;

    /**
     * 清单是否完成
     */
    private String accountCompletedStatus;

    /**
     * 联保投保单号
     */
    private List<String> unionPolicyNo;

    /**
     * 共保信息
     */
    private CoInsuranceMG coInsurance;

    /**
     * 关联项目
     */
    private RelatedProjectMG relatedProject;

    /**
     * 关联项目
     */
    private DebtorMG debtor;

    /**
     * 投保单审核阶段
     */
    private String auditStageCd;
    /**
     * 投保单审核状态
     */
    private String auditStatusCd;

    /**
     * 项目编码/立项代码
     *
     */
    private String projectInitiationCode;
    /**
     * 项目名称/立项名称
     *
     */
    private String projectInitiationName;

    /**
     * 项目版本
     */
    private Integer projectVersion;

    /**
     *是否代缴
     * @return
     */
    private String isPremiumBehalf;

    /**
     * 保费结构模板id（农线特有）
     */
    private String premiumStructureTemplateId;

    /**
     * 人工签发标识
     *
     */
    private String manualIssueFlag;

    /**
     * 政健-项目类型
     */
    private String projectType;


    /**
     *缴费有效截止时间
     */
    private LocalDateTime paymentEndDate;

    /**
     * 家财房屋信息
     * @return
     */
    private HouseHoldMG houseHoldMG;

    /**
     * 道客车架号集合（只有投保单有）
     */
    private List<String> vinNos;

    /**
     * 录单人编码和 经办人工号 合并list 补登使用
     */
    private List<String> handlerEmpNoAndRecordHolderEmpNos;

    public List<String> getHandlerEmpNoAndRecordHolderEmpNos() {
        return handlerEmpNoAndRecordHolderEmpNos;
    }

    public void setHandlerEmpNoAndRecordHolderEmpNos(List<String> handlerEmpNoAndRecordHolderEmpNos) {
        this.handlerEmpNoAndRecordHolderEmpNos = handlerEmpNoAndRecordHolderEmpNos;
    }

    public BigDecimal getFarmerQuantity() {
        return farmerQuantity;
    }

    public void setFarmerQuantity(BigDecimal farmerQuantity) {
        this.farmerQuantity = farmerQuantity;
    }

    public String getAccountCompletedStatus() {
        return accountCompletedStatus;
    }

    public void setAccountCompletedStatus(String accountCompletedStatus) {
        this.accountCompletedStatus = accountCompletedStatus;
    }

    public LocalDateTime getUnderwritingEndDt() {
        return underwritingEndDt;
    }

    public void setUnderwritingEndDt(LocalDateTime underwritingEndDt) {
        this.underwritingEndDt = underwritingEndDt;
    }

    public BigDecimal getInsuredQuantity() {
        return insuredQuantity;
    }

    public void setInsuredQuantity(BigDecimal insuredQuantity) {
        this.insuredQuantity = insuredQuantity;
    }

    public RelatedProjectMG getRelatedProject() {
        return relatedProject;
    }

    public void setRelatedProject(RelatedProjectMG relatedProject) {
        this.relatedProject = relatedProject;
    }

    public String getProjectInitiationCode() {
        return projectInitiationCode;
    }

    public void setProjectInitiationCode(String projectInitiationCode) {
        this.projectInitiationCode = projectInitiationCode;
    }

    public String getProjectInitiationName() {
        return projectInitiationName;
    }

    public void setProjectInitiationName(String projectInitiationName) {
        this.projectInitiationName = projectInitiationName;
    }

    public String getIsPremiumBehalf() {
        return isPremiumBehalf;
    }

    public void setIsPremiumBehalf(String isPremiumBehalf) {
        this.isPremiumBehalf = isPremiumBehalf;
    }

    public DebtorMG getDebtor() {
        return debtor;
    }

    public void setDebtor(DebtorMG debtor) {
        this.debtor = debtor;
    }

    public String getAuditStageCd() {
        return auditStageCd;
    }

    public void setAuditStageCd(String auditStageCd) {
        this.auditStageCd = auditStageCd;
    }



    public String getAuditStatusCd() {
        return auditStatusCd;
    }

    public void setAuditStatusCd(String auditStatusCd) {
        this.auditStatusCd = auditStatusCd;
    }




    public String getOrderNoXNB() {
        return orderNoXNB;
    }

    public void setOrderNoXNB(String orderNoXNB) {
        this.orderNoXNB = orderNoXNB;
    }

    public String getElectronicFlag() {
        return electronicFlag;
    }

    public void setElectronicFlag(String electronicFlag) {
        this.electronicFlag = electronicFlag;
    }



    public String getProjectType(){
        return projectType;
    }

    public void setProjectType(String projectType){
        this.projectType = projectType;
    }

    public String getManualIssueFlag() {
        return manualIssueFlag;
    }

    public void setManualIssueFlag(String manualIssueFlag) {
        this.manualIssueFlag = manualIssueFlag;
    }

    public String getIsGeneratePolicy() {
        return isGeneratePolicy;
    }

    public void setIsGeneratePolicy(String isGeneratePolicy) {
        this.isGeneratePolicy = isGeneratePolicy;
    }

    public SubjectAddressMG getSubjectAddress() {
        return subjectAddress;
    }

    public List<String> getSubjectSmallCategoryCodeList() {
        return subjectSmallCategoryCodeList;
    }

    public void setSubjectSmallCategoryCodeList(List<String> subjectSmallCategoryCodeList) {
        this.subjectSmallCategoryCodeList = subjectSmallCategoryCodeList;
    }

    public void setSubjectAddress(SubjectAddressMG subjectAddress) {
        this.subjectAddress = subjectAddress;
    }

    public String getSubjectDetailAddress() {
        return subjectDetailAddress;
    }

    public void setSubjectDetailAddress(String subjectDetailAddress) {
        this.subjectDetailAddress = subjectDetailAddress;
    }

    public String getProductSubjectCode() {
        return productSubjectCode;
    }

    public void setProductSubjectCode(String productSubjectCode) {
        this.productSubjectCode = productSubjectCode;
    }

    public String getProductSubjectName() {
        return productSubjectName;
    }

    public void setProductSubjectName(String productSubjectName) {
        this.productSubjectName = productSubjectName;
    }

    public ProposalOrganizerMG getProposalOrganizerInfo() {
        return proposalOrganizerInfo;
    }

    public void setProposalOrganizerInfo(ProposalOrganizerMG proposalOrganizerInfo) {
        this.proposalOrganizerInfo = proposalOrganizerInfo;
    }


    public List<String> getVinNos() {
        return vinNos;
    }

    public void setVinNos(List<String> vinNos) {
        this.vinNos = vinNos;
    }

    public HouseHoldMG getHouseHoldMG() {
        return houseHoldMG;
    }

    public void setHouseHoldMG(HouseHoldMG houseHoldMG) {
        this.houseHoldMG = houseHoldMG;
    }

    public LocalDateTime getPaymentEndDate() {
        return paymentEndDate;
    }

    public void setPaymentEndDate(LocalDateTime paymentEndDate) {
        this.paymentEndDate = paymentEndDate;
    }

    public String getIsUploadIdentityInfo() {
        return isUploadIdentityInfo;
    }

    public void setIsUploadIdentityInfo(String isUploadIdentityInfo) {
        this.isUploadIdentityInfo = isUploadIdentityInfo;
    }

    public String getIsSmsVerification() {
        return isSmsVerification;
    }

    public String getSmsSendPhone() {
        return smsSendPhone;
    }

    public void setSmsSendPhone(String smsSendPhone) {
        this.smsSendPhone = smsSendPhone;
    }

    public String getPayOrderNo() {
        return payOrderNo;
    }

    public void setPayOrderNo(String payOrderNo) {
        this.payOrderNo = payOrderNo;
    }

    public String getPaySerialNo() {
        return paySerialNo;
    }

    public void setPaySerialNo(String paySerialNo) {
        this.paySerialNo = paySerialNo;
    }

    public Integer getRenewalFlagCd() {
        return renewalFlagCd;
    }

    public void setRenewalFlagCd(Integer renewalFlagCd) {
        this.renewalFlagCd = renewalFlagCd;
    }

    public String getProposalStatusCd() {
        return proposalStatusCd;
    }

    public void setProposalStatusCd(String proposalStatusCd) {
        this.proposalStatusCd = proposalStatusCd;
    }

    public static long getSerialversionuid() {
        return serialVersionUID;
    }

    public String getIsFromInquiry() {
        return isFromInquiry;
    }

    public void setIsFromInquiry(String isFromInquiry) {
        this.isFromInquiry = isFromInquiry;
    }

    public String getTransModeCd() {
        return transModeCd;
    }

    public void setTransModeCd(String transModeCd) {
        this.transModeCd = transModeCd;
    }

    public LocalDateTime getProposalCreateDt() {
        return proposalCreateDt;
    }

    public void setProposalCreateDt(LocalDateTime proposalCreateDt) {
        this.proposalCreateDt = proposalCreateDt;
    }


    public String getIsEffectiveImmediately() {
        return isEffectiveImmediately;
    }

    public void setIsEffectiveImmediately(String isEffectiveImmediately) {
        this.isEffectiveImmediately = isEffectiveImmediately;
    }

    public String getIsReserveSign() {
        return isReserveSign;
    }

    public void setIsReserveSign(String isReserveSign) {
        this.isReserveSign = isReserveSign;
    }

    public List<SubjectGroupMG> getSubjectGroupMGList() {
        return subjectGroupMGList;
    }

    public void setSubjectGroupMGList(List<SubjectGroupMG> subjectGroupMGList) {
        this.subjectGroupMGList = subjectGroupMGList;
    }

    public LocalDateTime getQueryNoDt() {
        return queryNoDt;
    }

    public void setQueryNoDt(LocalDateTime queryNoDt) {
        this.queryNoDt = queryNoDt;
    }

    public void setIsSmsVerification(String isSmsVerification) {
        this.isSmsVerification = isSmsVerification;
    }

    public String getPaymentModeCd() {
        return paymentModeCd;
    }

    public void setPaymentModeCd(String paymentModeCd) {
        this.paymentModeCd = paymentModeCd;
    }

    public LocalDateTime getPayCompleteTime() {
        return payCompleteTime;
    }

    public void setPayCompleteTime(LocalDateTime payCompleteTime) {
        this.payCompleteTime = payCompleteTime;
    }

    public String getIssueErrorMessage() {
        return issueErrorMessage;
    }

    public void setIssueErrorMessage(String issueErrorMessage) {
        this.issueErrorMessage = issueErrorMessage;
    }

    public String getQuerySequenceNo() {
        return querySequenceNo;
    }

    public void setQuerySequenceNo(String querySequenceNo) {
        this.querySequenceNo = querySequenceNo;
    }

    public String getVerifySubjectTaskNo() {
        return verifySubjectTaskNo;
    }

    public void setVerifySubjectTaskNo(String verifySubjectTaskNo) {
        this.verifySubjectTaskNo = verifySubjectTaskNo;
    }

    public List<InstallmentMG> getInstallmentMGList() {
        return installmentMGList;
    }

    public void setInstallmentMGList(List<InstallmentMG> installmentMGList) {
        this.installmentMGList = installmentMGList;
    }

    public String getIsElectronicSign() {
        return isElectronicSign;
    }

    public void setIsElectronicSign(String isElectronicSign) {
        this.isElectronicSign = isElectronicSign;
    }

    public String getIsTemplateProposal() {
        return isTemplateProposal;
    }

    public void setIsTemplateProposal(String isTemplateProposal) {
        this.isTemplateProposal = isTemplateProposal;
    }

    public String getTemplateProposalNo() {
        return templateProposalNo;
    }

    public void setTemplateProposalNo(String templateProposalNo) {
        this.templateProposalNo = templateProposalNo;
    }

    public String getRemitUnitName() {
        return remitUnitName;
    }

    public void setRemitUnitName(String remitUnitName) {
        this.remitUnitName = remitUnitName;
    }

    public String getRemitUnitCustomerId() {
        return remitUnitCustomerId;
    }

    public void setRemitUnitCustomerId(String remitUnitCustomerId) {
        this.remitUnitCustomerId = remitUnitCustomerId;
    }

    public String getIsSendDoubleRecordLink() {
        return isSendDoubleRecordLink;
    }

    public void setIsSendDoubleRecordLink(String isSendDoubleRecordLink) {
        this.isSendDoubleRecordLink = isSendDoubleRecordLink;
    }

    public String getIsCompleteDoubleRecord() {
        return isCompleteDoubleRecord;
    }

    public void setIsCompleteDoubleRecord(String isCompleteDoubleRecord) {
        this.isCompleteDoubleRecord = isCompleteDoubleRecord;
    }

    public String getPremiumStructureTemplateId() {
        return premiumStructureTemplateId;
    }

    public void setPremiumStructureTemplateId(String premiumStructureTemplateId) {
        this.premiumStructureTemplateId = premiumStructureTemplateId;
    }

    public String getTemplateCode() {
        return templateCode;
    }

    public void setTemplateCode(String templateCode) {
        this.templateCode = templateCode;
    }

    public List<String> getUnionPolicyNo() {
        return unionPolicyNo;
    }

    public void setUnionPolicyNo(List<String> unionPolicyNo) {
        this.unionPolicyNo = unionPolicyNo;
    }

    public CoInsuranceMG getCoInsurance() {
        return coInsurance;
    }

    public void setCoInsurance(CoInsuranceMG coInsurance) {
        this.coInsurance = coInsurance;
    }

    public Integer getProjectVersion() {
        return projectVersion;
    }

    public void setProjectVersion(Integer projectVersion) {
        this.projectVersion = projectVersion;
    }
}
