package com.aliyun.fsi.insurance.biz.proposal.infrastructure.repository.dataobject;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class ProposalRelationPO  extends BasePO{
    private String proposalNo;

    private String underWriting;

    private String participantInfo;

    private String partner;

    private String schemePlan;

    private String subjectInfo;

    private String subjectGroupInfo;

    private String specialTerm;

    private String coInsurance;

    private String unionInsurance;

    private String reinsurance;

    private String thirdInternetCompany;

    private String facultativeReinsuranceIn;

    private String exclusive;

    private String riskSurvey;

    private String clauseInfo;
}